import type { ApiEnvelope, Change, ChangesPayload, Incident, IncidentsPayload } from "@/types";
import { INCIDENTS, INCIDENTS_BY_ID } from "@/lib/mock/incidents";
import { CHANGES, CHANGES_BY_ID, changesByIds } from "@/lib/mock/changes";
import { RECOMMENDATIONS_BY_ID, ROOT_CAUSES_BY_ID } from "@/lib/mock/causes";
import { evidenceByIds } from "@/lib/mock/evidence";
import { CURATED_PATHS_BY_ID } from "@/lib/mock/paths";
import { businessImpact, valueAtRisk } from "@/lib/calculations/impact";
import { WINDOW_AVAILABILITY } from "@/lib/mock/impact";
import { usd } from "@/lib/mock/primitives";
import { T, WINDOW_IMPACT } from "@/lib/mock/narrative";

const WINDOW_IMPACT_NOW = T.now;
import { rangeMinutes } from "@/lib/mock/time";
import { DEMO_NOW } from "@/lib/utils/clock";
import { ApiRequestError, respond, type ApiOptions } from "./client";
import { entityIdSchema } from "./schemas";

function withinWindow(iso: string, rangeKey: Parameters<typeof rangeMinutes>[0]): boolean {
  const cutoff = DEMO_NOW.getTime() - rangeMinutes(rangeKey) * 60_000;
  return new Date(iso).getTime() >= cutoff;
}

export async function getIncidents(options: ApiOptions = {}): Promise<ApiEnvelope<IncidentsPayload>> {
  return respond("/api/incidents", options, (ctx): IncidentsPayload => {
    // Active incidents always show, regardless of window; resolved ones are
    // scoped to the selected range so the list answers "what happened recently".
    const incidents = INCIDENTS.filter(
      (i) => i.state !== "resolved" || withinWindow(i.resolvedAt ?? i.startedAt, ctx.rangeKey),
    ).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const active = incidents.filter((i) => i.state !== "resolved");
    return {
      incidents,
      summary: {
        active: active.length,
        resolvedInWindow: incidents.length - active.length,
        customersAffected: WINDOW_IMPACT.customersAffected,
        valueAtRisk: usd(active.reduce((sum, i) => sum + i.valueAtRisk.amount, 0)),
        meanTimeToIdentifyMinutes: 0.83,
      },
    };
  });
}

export async function getIncident(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<Incident>> {
  const incidentId = entityIdSchema.parse(id);
  return respond("/api/incidents/:id", options, () => {
    const incident = INCIDENTS_BY_ID.get(incidentId);
    if (!incident) throw new ApiRequestError("not-found", `No incident with id "${incidentId}".`);
    return incident;
  });
}

export async function getChanges(options: ApiOptions = {}): Promise<ApiEnvelope<ChangesPayload>> {
  return respond("/api/changes", options, (ctx): ChangesPayload => {
    const changes = CHANGES.filter((c) => withinWindow(c.at, ctx.rangeKey === "1h" || ctx.rangeKey === "6h" ? "30d" : ctx.rangeKey)).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return {
      changes,
      summary: {
        total: changes.length,
        correlated: changes.filter((c) => c.correlation).length,
        rolledBack: changes.filter((c) => c.rolledBack).length,
        highRisk: changes.filter((c) => c.risk === "high").length,
      },
    };
  });
}

export async function getChange(id: string, options: ApiOptions = {}): Promise<ApiEnvelope<Change>> {
  const changeId = entityIdSchema.parse(id);
  return respond("/api/changes/:id", options, () => {
    const change = CHANGES_BY_ID.get(changeId);
    if (!change) throw new ApiRequestError("not-found", `No change with id "${changeId}".`);
    return change;
  });
}

/**
 * Everything an incident investigation needs in one round trip: the incident,
 * its attributed cause, the changes correlated to it, the evidence behind every
 * claim and the causal path through the graph.
 */
export interface IncidentContext {
  incident: Incident;
  rootCause?: import("@/types").RootCause;
  recommendations: import("@/types").Recommendation[];
  changes: Change[];
  evidence: import("@/types").Evidence[];
  path?: import("@/types").GraphPath;
  impact: import("@/types").BusinessImpact;
}

export async function getIncidentContext(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<IncidentContext>> {
  const incidentId = entityIdSchema.parse(id);
  return respond("/api/incidents/:id/context", options, () => {
    const incident = INCIDENTS_BY_ID.get(incidentId);
    if (!incident) throw new ApiRequestError("not-found", `No incident with id "${incidentId}".`);

    const rootCause = incident.rootCauseId ? ROOT_CAUSES_BY_ID.get(incident.rootCauseId) : undefined;
    const { money, basis } = valueAtRisk({
      failedTransactions: incident.transactionsFailed || 1,
      averageOrderValue: WINDOW_IMPACT.averageOrderValue,
      currency: "USD",
      transactionEvidenceId: "ev-007",
      aovEvidenceId: "ev-009",
    });

    return {
      incident,
      rootCause,
      recommendations: incident.recommendationIds
        .map((rid) => RECOMMENDATIONS_BY_ID.get(rid))
        .filter((r): r is import("@/types").Recommendation => Boolean(r)),
      changes: changesByIds(incident.changeIds),
      evidence: evidenceByIds(incident.evidenceIds),
      path: rootCause?.pathId ? CURATED_PATHS_BY_ID.get(rootCause.pathId) : undefined,
      impact: businessImpact({
        customersAffected: incident.customersAffected,
        customersActive: WINDOW_IMPACT.customersActive,
        transactionsFailed: incident.transactionsFailed,
        transactionsAtRisk: Math.round(incident.transactionsFailed * 1.21),
        conversionImpactPct: -19.4,
        from: incident.startedAt,
        to: incident.resolvedAt ?? WINDOW_IMPACT_NOW,
        estimated: incident.valueAtRisk.amount > 0 ? incident.valueAtRisk : money,
        basis,
        observedLost: incident.observedValueLost,
        availability: WINDOW_AVAILABILITY,
      }),
    };
  });
}
