import type {
  ApiEnvelope,
  CustomerSearchResult,
  CustomerTracePayload,
} from "@/types";
import {
  CUSTOMERS,
  CUSTOMERS_BY_ID,
  CUSTOMER_NARRATIVE,
  INTERACTIONS,
  INTERACTIONS_BY_SESSION,
  SESSIONS,
  SESSIONS_BY_CUSTOMER,
  TRANSACTIONS_BY_CUSTOMER,
} from "@/lib/mock/customers";
import { evidenceByIds } from "@/lib/mock/evidence";
import { CURATED_PATHS_BY_ID } from "@/lib/mock/paths";
import { JOURNEY_NAMES } from "@/lib/mock/journeys";
import { businessImpact, valueAtRisk } from "@/lib/calculations/impact";
import { WINDOW_IMPACT, T } from "@/lib/mock/narrative";
import { observed } from "@/lib/mock/primitives";
import { ApiRequestError, respond, type ApiOptions } from "./client";
import { customerSearchSchema, entityIdSchema } from "./schemas";
import { applyPolicy } from "./scopes";

/**
 * Customer search accepts an email, a customer id, a session id or a
 * transaction id — the four identifiers an operator actually has to hand.
 */
export async function searchCustomers(
  term: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<CustomerSearchResult[]>> {
  const { term: query } = customerSearchSchema.parse({ term });
  return respond("/api/customers/search", options, (ctx) => {
    const q = query.toLowerCase();
    const results: CustomerSearchResult[] = [];

    for (const customer of CUSTOMERS) {
      let matchedOn: CustomerSearchResult["matchedOn"] | undefined;
      if (customer.email.toLowerCase().includes(q)) matchedOn = "email";
      else if (customer.id.toLowerCase().includes(q)) matchedOn = "customer-id";
      else if (customer.displayName.toLowerCase().includes(q)) matchedOn = "name";
      else if ((SESSIONS_BY_CUSTOMER[customer.id] ?? []).some((s) => s.id.toLowerCase().includes(q)))
        matchedOn = "session-id";
      else if (
        (TRANSACTIONS_BY_CUSTOMER[customer.id] ?? []).some((t) => t.id.toLowerCase().includes(q))
      )
        matchedOn = "transaction-id";

      if (!matchedOn) continue;
      const sessions = SESSIONS_BY_CUSTOMER[customer.id] ?? [];
      const lastSeenAt = sessions.length
        ? sessions.reduce((latest, s) => (s.startedAt > latest ? s.startedAt : latest), sessions[0].startedAt)
        : customer.joinedAt;

      const safe = applyPolicy(customer, ctx.scopes);
      results.push({
        id: safe.id,
        displayName: safe.displayName,
        emailMasked: safe.emailMasked,
        region: safe.region,
        tier: safe.tier,
        health: safe.currentHealth,
        lastSeenAt,
        matchedOn,
      });
    }

    return results.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  });
}

export async function getCustomerTrace(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<CustomerTracePayload>> {
  const customerId = entityIdSchema.parse(id);
  return respond("/api/customers/:id/trace", options, (ctx) => {
    const raw = CUSTOMERS_BY_ID.get(customerId);
    if (!raw) throw new ApiRequestError("not-found", `No customer with id "${customerId}".`);
    const customer = applyPolicy(raw, ctx.scopes);

    const sessions = (SESSIONS_BY_CUSTOMER[customerId] ?? []).sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt),
    );
    const currentSession = sessions.find((s) => !s.endedAt);
    const interactions = sessions
      .flatMap((s) => INTERACTIONS_BY_SESSION[s.id] ?? [])
      .sort((a, b) => a.at.localeCompare(b.at));
    const transactions = (TRANSACTIONS_BY_CUSTOMER[customerId] ?? []).sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt),
    );

    const failure = interactions.find((i) => i.status === "error" && i.journeyStepId);
    const narrative = CUSTOMER_NARRATIVE[customerId] ?? [
      {
        text: "No failure was recorded for this customer in the selected window.",
        evidenceIds: [],
      },
    ];

    const failedValue = transactions
      .filter((t) => t.status === "failed" || t.status === "abandoned")
      .reduce((sum, t) => sum + t.value.amount, 0);

    const { money, basis } = valueAtRisk({
      failedTransactions: transactions.filter((t) => t.status !== "completed").length,
      averageOrderValue: failedValue
        ? failedValue / Math.max(1, transactions.filter((t) => t.status !== "completed").length)
        : WINDOW_IMPACT.averageOrderValue,
      currency: "USD",
      transactionEvidenceId: "ev-007",
      aovEvidenceId: "ev-009",
    });

    const evidenceIds = [
      ...new Set([...narrative.flatMap((n) => n.evidenceIds), ...interactions.flatMap((i) => i.evidenceIds)]),
    ];

    return {
      customer,
      currentSession,
      sessions,
      interactions,
      transactions,
      journeys: sessions.flatMap((s) =>
        s.journeyIds.map((journeyId) => ({
          journeyId,
          name: JOURNEY_NAMES[journeyId] ?? journeyId,
          outcome: s.outcome,
          at: s.startedAt,
        })),
      ),
      failurePoint: failure
        ? {
            interactionId: failure.id,
            summary: failure.detail ?? failure.label,
            journeyId: failure.journeyId ?? "jny-checkout",
            journeyStepId: failure.journeyStepId ?? "stp-checkout-pay",
            applicationId: failure.applicationId ?? "app-payments",
            at: failure.at,
          }
        : undefined,
      narrative,
      path: CURATED_PATHS_BY_ID.get("path-trace-88213"),
      impact: businessImpact({
        customersAffected: 1,
        customersActive: 1,
        transactionsFailed: transactions.filter((t) => t.status === "failed").length,
        transactionsAtRisk: transactions.filter((t) => t.status !== "completed").length,
        conversionImpactPct: -100,
        from: sessions[0]?.startedAt ?? T.now,
        to: T.now,
        estimated: money,
        basis: {
          ...basis,
          method: "Unresolved basket value for this customer",
          formula: `${transactions.filter((t) => t.status !== "completed").length} unresolved transactions × their own basket value`,
        },
        observedLost: observed(0),
        availability: {
          state: "partial",
          missing: ["session replay"],
          note: "Session replay is sampled at 2% and has no capture for this session.",
        },
      }),
      evidence: evidenceByIds(evidenceIds),
    };
  });
}

export async function getRecentCustomers(
  options: ApiOptions = {},
): Promise<ApiEnvelope<CustomerSearchResult[]>> {
  return respond("/api/customers/recent", options, (ctx) =>
    CUSTOMERS.filter((c) => c.currentHealth !== "healthy")
      .map((c) => {
        const safe = applyPolicy(c, ctx.scopes);
        const sessions = SESSIONS_BY_CUSTOMER[c.id] ?? [];
        return {
          id: safe.id,
          displayName: safe.displayName,
          emailMasked: safe.emailMasked,
          region: safe.region,
          tier: safe.tier,
          health: safe.currentHealth,
          lastSeenAt: sessions[0]?.startedAt ?? safe.joinedAt,
          matchedOn: "customer-id" as const,
        };
      })
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)),
  );
}

export const ALL_SESSIONS = SESSIONS;
export const ALL_INTERACTIONS = INTERACTIONS;
