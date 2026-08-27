import type {
  AskAnswer,
  AskSuggestion,
  Citation,
  InvestigationTrace,
  TimeRangeKey,
} from "@/types";
import { businessImpact, conversionValueAtRisk, valueAtRisk } from "@/lib/calculations/impact";
import { SPARQL_TEMPLATES, renderSparql } from "@/lib/ontology/sparql";
import { EVIDENCE_BY_ID, evidenceByIds } from "./evidence";
import { ROOT_CAUSES_BY_ID, RECOMMENDATIONS_BY_ID } from "./causes";
import { CURATED_PATHS_BY_ID } from "./paths";
import { CHECKOUT_IMPACT, T, WINDOW_IMPACT } from "./narrative";
import { confidence, observed } from "./primitives";
import { WINDOW_AVAILABILITY } from "./impact";

/**
 * Ask APPX — deterministic, evidence-backed answers.
 *
 * This is intentionally not a text generator. Each answer is assembled from the
 * same dataset every other screen reads, so the number in an answer is the same
 * number on the Command Center, and every sentence resolves to evidence
 * handles that open the real record.
 *
 * A production implementation replaces `answerQuestion` with a retrieval and
 * reasoning service; the response shape is already the contract.
 */

interface Intent {
  id: string;
  /** All terms in a group must appear; any group matching selects the intent. */
  patterns: string[][];
  build: (question: string, rangeKey: TimeRangeKey) => AskAnswer;
}

function citations(pairs: Array<[string, string]>): Citation[] {
  return pairs.map(([evidenceId, claim]) => ({
    evidenceId,
    handle: EVIDENCE_BY_ID.get(evidenceId)?.handle ?? evidenceId,
    claim,
  }));
}

function investigation(
  question: string,
  steps: Array<{ action: string; query?: string; finding: string; evidenceIds: string[]; durationMs: number }>,
  entitiesTouched: number,
  factsConsidered: number,
): InvestigationTrace {
  return {
    id: `inv-${question.length}-${steps.length}`,
    question,
    startedAt: T.now,
    steps: steps.map((s, i) => ({ id: `step-${i + 1}`, order: i + 1, ...s })),
    entitiesTouched,
    factsConsidered,
  };
}

function base(question: string): Pick<AskAnswer, "id" | "question" | "askedAt"> {
  return { id: `ask-${hash(question)}`, question, askedAt: T.now };
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/* ------------------------------ Intent: cause ----------------------------- */

function checkoutCauseAnswer(question: string): AskAnswer {
  const { money, basis } = valueAtRisk({
    failedTransactions: CHECKOUT_IMPACT.transactionsFailed,
    averageOrderValue: WINDOW_IMPACT.averageOrderValue,
    currency: "USD",
    transactionEvidenceId: "ev-007",
    aovEvidenceId: "ev-009",
  });

  return {
    ...base(question),
    executiveSummary:
      "Checkout is failing at the payment step for about one in four customers. 18,420 customers have been affected since 14:33 UTC and $4.69M of transaction value is at risk, of which $912K has already been observed as reversed or failed captures. The cause is a Payment Service deployment that reduced the database connection ceiling from 240 to 60 per pod; the payment tier can no longer acquire connections fast enough and authorisations time out at 8 seconds.",
    impact: businessImpact({
      customersAffected: CHECKOUT_IMPACT.customersAffected,
      customersActive: WINDOW_IMPACT.customersActive,
      transactionsFailed: CHECKOUT_IMPACT.transactionsFailed,
      transactionsAtRisk: 26_410,
      conversionImpactPct: -19.4,
      from: T.journeyDegraded,
      to: T.now,
      estimated: money,
      basis,
      observedLost: observed(CHECKOUT_IMPACT.observedValueLost.amount),
      availability: WINDOW_AVAILABILITY,
    }),
    rootCause: ROOT_CAUSES_BY_ID.get("rc-payment-latency"),
    citations: citations([
      ["ev-001", "Checkout success rate fell from 99.2% to 71.4%."],
      ["ev-008", "18,420 distinct customers were affected."],
      ["ev-010", "$4.69M of transaction value is modelled as at risk."],
      ["ev-012", "$912K has been observed as reversed or failed captures."],
      ["ev-002", "Payment Service p95 rose 8.4× at 14:31:12 UTC."],
      ["ev-003", "The payments database connection pool is at 97% utilisation."],
      ["ev-005", "The deployment lowered maxPoolSize from 240 to 60."],
      ["ev-013", "The deployment precedes the degradation and is the only change on the payment path."],
    ]),
    evidence: evidenceByIds([
      "ev-001",
      "ev-002",
      "ev-003",
      "ev-004",
      "ev-005",
      "ev-006",
      "ev-007",
      "ev-008",
      "ev-009",
      "ev-010",
      "ev-012",
      "ev-013",
      "ev-017",
      "ev-055",
    ]),
    path: CURATED_PATHS_BY_ID.get("path-checkout-causal"),
    recommendations: [
      RECOMMENDATIONS_BY_ID.get("rec-rollback-payments")!,
      RECOMMENDATIONS_BY_ID.get("rec-shed-risk-engine")!,
      RECOMMENDATIONS_BY_ID.get("rec-checkout-failfast")!,
    ],
    followUps: [
      "Show me the customers affected",
      "What changed before this incident?",
      "If the payments database fails, what breaks?",
      "Why this number?",
    ],
    confidence: confidence(
      0.91,
      "The chain from customer impact to payment latency to pool saturation is observed end to end. The final attribution to the deployment is derived from ordering plus the fact that the changed file is the pool configuration itself.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Resolve the question to a business journey",
          query: renderSparql(SPARQL_TEMPLATES.applicationsAffectingJourney, { journey: "journey/checkout" }),
          finding: "Complete Checkout is degraded; the payment step accounts for 21.6 of 23.4 points of drop-off.",
          evidenceIds: ["ev-001"],
          durationMs: 84,
        },
        {
          action: "Walk the dependency closure from the failing step",
          finding: "Checkout API → Payments Platform → Payment Service → payments primary database.",
          evidenceIds: ["ev-011", "ev-033"],
          durationMs: 141,
        },
        {
          action: "Rank downstream entities by deviation from baseline",
          finding: "Payment Service p95 +739%, pool utilisation +86%, gateway unchanged — the fault is inside the estate.",
          evidenceIds: ["ev-002", "ev-003", "ev-017"],
          durationMs: 96,
        },
        {
          action: "Correlate changes against the blast radius",
          query: renderSparql(SPARQL_TEMPLATES.changesCorrelatedWithIncident, { incident: "incident/4417", windowMinutes: 360 }),
          finding: "One change touched the payment path in six hours: pay-2026.08.26.4, which modified config/pool.yaml.",
          evidenceIds: ["ev-004", "ev-005", "ev-013"],
          durationMs: 187,
        },
        {
          action: "Quantify business impact from observed transactions",
          finding: "21,860 failed or abandoned transactions across 18,420 customers; $912K observed lost, $4.69M modelled at risk.",
          evidenceIds: ["ev-007", "ev-008", "ev-009", "ev-012"],
          durationMs: 212,
        },
      ],
      1_284,
      41_820,
    ),
    limitations: [
      "The revenue ledger last settled at 15:08 UTC, so the final four minutes are experience-derived rather than confirmed.",
      "Basket recovery is not modelled: 31–46% of abandoned baskets are historically recovered within 24 hours, so settled loss will be lower than $4.69M.",
      "Session replay is sampled at 2%, so most affected sessions have no replay to inspect.",
    ],
    relatedEntityIds: ["jny-checkout", "app-payments", "svc-payment-service", "db-payments-primary", "chg-8841", "inc-4417"],
  };
}

function europeLatencyAnswer(question: string): AskAnswer {
  const { money, basis } = conversionValueAtRisk({
    conversionDropPct: 11.2,
    dailyAttributedRevenue: 7_250_000,
    hoursAffected: 4.1,
    currency: "USD",
    evidenceIds: ["ev-025", "ev-026"],
    attributionNote:
      "Search-attributed revenue is modelled from session sequences, not read from the ledger — a customer who searched may convert through another surface.",
  });

  return {
    ...base(question),
    executiveSummary:
      "European customers are seeing slow search because a routing policy change moved their traffic onto a degraded network path. 41,200 customers have been affected since 11:05 UTC and search-attributed conversion is down 11.2% across EU regions, which models to roughly $812K of revenue contribution at risk. The interface now carrying the traffic shows 0.68% packet loss and 38.6 ms round-trip against a 1.4 ms baseline.",
    impact: businessImpact({
      customersAffected: 41_200,
      customersActive: WINDOW_IMPACT.customersActive,
      transactionsFailed: 0,
      transactionsAtRisk: 96_400,
      conversionImpactPct: -11.2,
      from: T.euLatencyStart,
      to: T.now,
      estimated: money,
      basis,
      availability: {
        state: "partial",
        missing: ["ap-southeast search telemetry"],
        note: "The Google Cloud Operations feed is 38 minutes stale, so ap-southeast search health is reported from Datadog only.",
      },
    }),
    rootCause: ROOT_CAUSES_BY_ID.get("rc-eu-network-latency"),
    citations: citations([
      ["ev-021", "Search p95 in eu-central rose from 486 ms to 1,412 ms."],
      ["ev-027", "41,200 European customers experienced degraded search."],
      ["ev-022", "Inter-AZ round-trip latency rose to 38.6 ms."],
      ["ev-023", "Ethernet3/1 shows 0.68% packet loss."],
      ["ev-024", "CHG-8836 lowered BGP local-preference at 10:48 UTC."],
      ["ev-025", "Search-attributed conversion fell 11.2%."],
      ["ev-041", "All eight index nodes sit in a single availability zone."],
    ]),
    evidence: evidenceByIds(["ev-021", "ev-022", "ev-023", "ev-024", "ev-025", "ev-026", "ev-027", "ev-028", "ev-041", "ev-053"]),
    path: CURATED_PATHS_BY_ID.get("path-search-causal"),
    recommendations: [
      RECOMMENDATIONS_BY_ID.get("rec-revert-bgp")!,
      RECOMMENDATIONS_BY_ID.get("rec-spread-search-index")!,
    ],
    followUps: [
      "Which business services traverse this router?",
      "Has this router failed before?",
      "What changed in eu-central today?",
      "Why this number?",
    ],
    confidence: confidence(
      0.87,
      "The network measurements and the policy change are both directly observed. The revenue figure is a conversion model and carries materially lower confidence than the latency finding.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Scope the question to a region and a journey",
          finding: "Search degradation is confined to eu-west and eu-central; other regions are within baseline.",
          evidenceIds: ["ev-021"],
          durationMs: 71,
        },
        {
          action: "Resolve the serving path for EU search traffic",
          query: renderSparql(SPARQL_TEMPLATES.servicesTraversingNetworkElement, { element: "device/core-rtr-euc1-01" }),
          finding: "Search Query Service runs only in euc1-az1b and reaches its index tier through core-rtr-euc1-01.",
          evidenceIds: ["ev-041"],
          durationMs: 128,
        },
        {
          action: "Compare network measurements against baseline",
          finding: "Round-trip latency 38.6 ms against 1.4 ms; 0.68% loss on Ethernet3/1.",
          evidenceIds: ["ev-022", "ev-023"],
          durationMs: 94,
        },
        {
          action: "Correlate against the change record",
          finding: "CHG-8836 changed BGP local-preference 17 minutes before the first latency reading.",
          evidenceIds: ["ev-024"],
          durationMs: 156,
        },
      ],
      412,
      18_400,
    ),
    limitations: [
      "Search-to-revenue attribution is modelled, not read from the ledger.",
      "The interface may carry an underlying hardware fault, in which case the routing change is an exposure rather than the sole cause.",
      "ap-southeast telemetry is 38 minutes stale.",
    ],
    relatedEntityIds: ["jny-search", "app-search", "svc-search-query", "rtr-core-euc1", "chg-8836", "inc-4416"],
  };
}

function customersAffectedAnswer(question: string): AskAnswer {
  const { money, basis } = valueAtRisk({
    failedTransactions: WINDOW_IMPACT.transactionsFailed,
    averageOrderValue: WINDOW_IMPACT.averageOrderValue,
    currency: "USD",
    transactionEvidenceId: "ev-007",
    aovEvidenceId: "ev-009",
  });

  return {
    ...base(question),
    executiveSummary:
      "24,780 customers are affected right now — 0.79% of the 3.14M active in the window. That figure is deduplicated: 18,420 hit a failing checkout and 41,200 saw degraded European search, but the two sets overlap and many affected customers have more than one failed transaction. US East carries 61% of the impact, consistent with where the payment canary is deployed.",
    impact: businessImpact({
      customersAffected: WINDOW_IMPACT.customersAffected,
      customersActive: WINDOW_IMPACT.customersActive,
      transactionsFailed: WINDOW_IMPACT.transactionsFailed,
      transactionsAtRisk: WINDOW_IMPACT.transactionsAtRisk,
      conversionImpactPct: -19.4,
      from: T.journeyDegraded,
      to: T.now,
      estimated: money,
      basis,
      observedLost: observed(WINDOW_IMPACT.observedValueLost.amount),
      availability: WINDOW_AVAILABILITY,
    }),
    citations: citations([
      ["ev-008", "18,420 distinct customers hit a failing checkout."],
      ["ev-027", "41,200 European customers experienced degraded search."],
      ["ev-020", "US East carries 61% of affected customers."],
      ["ev-007", "26,410 transactions failed or were abandoned."],
    ]),
    evidence: evidenceByIds(["ev-008", "ev-027", "ev-020", "ev-007", "ev-031", "ev-010", "ev-012"]),
    recommendations: [RECOMMENDATIONS_BY_ID.get("rec-rollback-payments")!],
    followUps: [
      "Which journeys are breaking?",
      "Where is the impact happening?",
      "Why is checkout failing?",
      "Show me a customer who failed",
    ],
    confidence: confidence(
      0.93,
      "Customer counts come from transaction and session records, both authoritative. Deduplication across journeys is the only derived step.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Collect affected customer sets per active incident",
          query: renderSparql(SPARQL_TEMPLATES.customersAffectedByService, {
            service: "service/payment-service",
            from: T.journeyDegraded,
            to: T.now,
          }),
          finding: "Three active incidents contribute affected customers: INC-4417, INC-4416 and INC-4414.",
          evidenceIds: ["ev-008", "ev-027", "ev-031"],
          durationMs: 164,
        },
        {
          action: "Deduplicate across journeys and sessions",
          finding: "Union of the three sets is 24,780 distinct customer identities, not the 62,800 naive sum.",
          evidenceIds: ["ev-008"],
          durationMs: 218,
        },
        {
          action: "Attribute by region",
          finding: "US East 11,236 · US West 4,180 · EU West 3,420 · EU Central 3,180 · rest 2,764.",
          evidenceIds: ["ev-020"],
          durationMs: 92,
        },
      ],
      2_140,
      64_200,
    ),
    limitations: [
      "Customers affected only by slow-but-successful journeys are not counted here; the experience score reflects them instead.",
      "The count covers the selected window only and grows while the incidents remain open.",
    ],
    relatedEntityIds: ["jny-checkout", "jny-search", "jny-subscription-renew", "inc-4417", "inc-4416"],
  };
}

function whatChangedAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "One change is responsible. Payment Service deployment pay-2026.08.26.4 began a 25% canary at 14:26 UTC and lowered the per-pod database connection ceiling from 240 to 60. Pool saturation followed within four minutes and checkout degraded seven minutes after the deployment. Two other changes landed earlier today but neither touched the payment path: a checkout release at 09:15 UTC that lengthened the authorisation timeout, and an orders index rebuild that completed cleanly at 04:12 UTC.",
    rootCause: ROOT_CAUSES_BY_ID.get("rc-payment-latency"),
    citations: citations([
      ["ev-004", "The canary reached 25% of payment pods at 14:29:12 UTC."],
      ["ev-005", "maxPoolSize was lowered from 240 to 60."],
      ["ev-013", "No other change touched the payment path in six hours."],
      ["ev-003", "Pool saturation followed within four minutes."],
      ["ev-015", "The rollout was paused at 14:52 UTC but the affected pods still hold the reduced ceiling."],
    ]),
    evidence: evidenceByIds(["ev-004", "ev-005", "ev-013", "ev-003", "ev-015", "ev-050"]),
    path: CURATED_PATHS_BY_ID.get("path-checkout-causal"),
    recommendations: [RECOMMENDATIONS_BY_ID.get("rec-rollback-payments")!, RECOMMENDATIONS_BY_ID.get("rec-pool-guardrail")!],
    followUps: [
      "Why is checkout failing?",
      "What should I do now?",
      "Has this happened before?",
      "Show me the deployment",
    ],
    confidence: confidence(
      0.91,
      "Change records are authoritative and the ordering is unambiguous. The causal step from configuration to saturation is derived, though the changed file is the pool configuration itself.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Assemble the incident blast radius",
          finding: "42 entities across the payment, checkout and order paths.",
          evidenceIds: ["ev-011"],
          durationMs: 118,
        },
        {
          action: "Find changes touching any of those entities in the last 6 hours",
          query: renderSparql(SPARQL_TEMPLATES.changesCorrelatedWithIncident, { incident: "incident/4417", windowMinutes: 360 }),
          finding: "Three changes: CHG-8841, CHG-8839, CHG-8837.",
          evidenceIds: ["ev-004"],
          durationMs: 143,
        },
        {
          action: "Rank by temporal proximity and topological overlap",
          finding: "CHG-8841 precedes the first symptom by 3m40s and modifies the exact subsystem that failed.",
          evidenceIds: ["ev-005", "ev-013"],
          durationMs: 97,
        },
      ],
      842,
      12_400,
    ),
    limitations: [
      "Correlation is temporal and topological. It is strong here because the changed file is the failing subsystem's configuration, but the graph does not prove causation.",
      "Changes made outside the tracked systems of record would not appear.",
    ],
    relatedEntityIds: ["chg-8841", "chg-8839", "chg-8837", "svc-payment-service", "inc-4417"],
  };
}

function blastRadiusAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "If the payments primary database fails completely, four business journeys stop: Complete Checkout, Make a Payment, Renew Nike Membership and Redeem a Gift Card. That is roughly 1.19M customers in a comparable window and about $10.4M of transaction value per hour at current volume. There is no failover: over 90 days of traces the graph has never observed an alternative authorisation path.",
    citations: citations([
      ["ev-034", "Four journeys transitively depend on the payments database."],
      ["ev-054", "No alternative authorisation path has ever been observed."],
      ["ev-033", "Payment Service persists to the payments primary on every authorisation."],
      ["ev-009", "Average order value is $214.60."],
    ]),
    evidence: evidenceByIds(["ev-034", "ev-054", "ev-033", "ev-009", "ev-003"]),
    recommendations: [RECOMMENDATIONS_BY_ID.get("rec-shed-risk-engine")!],
    followUps: [
      "Open the full impact analysis",
      "Which applications depend on this database?",
      "What is at risk right now?",
    ],
    confidence: confidence(
      0.74,
      "The dependency structure is trace-observed and reliable. The customer and value figures scale current traffic into a hypothetical failure, so they are indicative rather than precise.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Invert the dependency closure from the origin entity",
          query: renderSparql(SPARQL_TEMPLATES.blastRadius, { origin: "database/payments-primary", depth: 4 }),
          finding: "29 entities reachable within four hops, of which four are business journeys.",
          evidenceIds: ["ev-034"],
          durationMs: 164,
        },
        {
          action: "Check for alternative paths",
          finding: "None observed in 90 days of traces; checkout has a single authorisation route.",
          evidenceIds: ["ev-054"],
          durationMs: 231,
        },
        {
          action: "Scale observed volume to the failure scenario",
          finding: "1.19M customers, deduplicated across the four journeys, and roughly $10.4M per hour of transaction value.",
          evidenceIds: ["ev-009"],
          durationMs: 88,
        },
      ],
      31,
      9_400,
    ),
    limitations: [
      "This is a forward-looking scenario, so no observed loss exists — every figure is modelled.",
      "An untested failover path could exist without ever having carried traffic, in which case the graph cannot see it.",
    ],
    relatedEntityIds: ["db-payments-primary", "jny-checkout", "jny-payment", "jny-subscription-renew", "jny-gift-card"],
  };
}

function topProblemsAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "Ranked by modelled value at risk right now: Payments Platform $4.69M, Checkout API $4.69M (the same impact seen from the journey side, not additive), Order Management $1.51M, Search & Discovery $812K, and Subscriptions Platform $437K. Payments and Checkout are one incident viewed from two layers. Over the quarter, Payments Platform alone accounts for 41% of all modelled value at risk.",
    citations: citations([
      ["ev-010", "Checkout and payments account for $4.69M of value at risk."],
      ["ev-026", "European search accounts for $812K."],
      ["ev-046", "Payments is 41% of quarterly value at risk."],
      ["ev-045", "Change failure rate has risen to 18.4%."],
    ]),
    evidence: evidenceByIds(["ev-010", "ev-026", "ev-046", "ev-045", "ev-038", "ev-031"]),
    recommendations: [
      RECOMMENDATIONS_BY_ID.get("rec-rollback-payments")!,
      RECOMMENDATIONS_BY_ID.get("rec-pool-guardrail")!,
      RECOMMENDATIONS_BY_ID.get("rec-revert-bgp")!,
    ],
    followUps: [
      "Show me the executive view",
      "Which journeys are breaking?",
      "What could break next?",
    ],
    confidence: confidence(
      0.77,
      "The ranking aggregates per-incident modelled estimates, so it inherits their uncertainty. The relative order is more reliable than the absolute figures.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Collect modelled value at risk per application",
          finding: "Five applications carry non-zero value at risk in the window.",
          evidenceIds: ["ev-010", "ev-026"],
          durationMs: 96,
        },
        {
          action: "Deduplicate impact shared across layers",
          finding: "Payments and Checkout share one incident; the figures are the same impact from two vantage points.",
          evidenceIds: ["ev-010"],
          durationMs: 124,
        },
        {
          action: "Compare against the quarterly distribution",
          finding: "Payments Platform is 41% of quarterly value at risk — a concentration, not a one-off.",
          evidenceIds: ["ev-046"],
          durationMs: 172,
        },
      ],
      64,
      22_800,
    ),
    limitations: [
      "Values are modelled, not settled revenue, and must not be added together across layers.",
      "Applications with no revenue attribution model — Identity, Notifications — cannot be ranked this way.",
    ],
    relatedEntityIds: ["app-payments", "app-checkout", "app-orders", "app-search", "app-subscriptions"],
  };
}

function traceCustomerAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "This customer opened a $1,284.40 basket at 14:33:48 UTC and failed at the payment step twice. The authorisation request reached Checkout API and then timed out after 8.2 seconds inside Payment Service — it never reached the payment gateway, because it could not acquire a database connection. The customer retried once, tapped Pay five more times in four seconds, and left. The basket is still open. They have completed 14 checkouts in the last 90 days without a single failure.",
    citations: citations([
      ["ev-014", "The request timed out after 8.2 seconds inside Payment Service."],
      ["ev-006", "The failure was a pool acquisition timeout."],
      ["ev-003", "The payments pool was at 97% utilisation."],
      ["ev-004", "A deployment reached 25% of pods eleven minutes earlier."],
      ["ev-049", "The session scored 12 of 100."],
      ["ev-048", "14 prior checkouts completed without failure."],
    ]),
    evidence: evidenceByIds(["ev-014", "ev-006", "ev-003", "ev-004", "ev-005", "ev-049", "ev-048"]),
    path: CURATED_PATHS_BY_ID.get("path-trace-88213"),
    recommendations: [RECOMMENDATIONS_BY_ID.get("rec-checkout-failfast")!],
    followUps: [
      "Open the full customer trace",
      "How many other customers hit this?",
      "Why is checkout failing?",
    ],
    confidence: confidence(0.98, "Every hop is a span in a single distributed trace, joined to the change record by timestamp."),
    investigation: investigation(
      question,
      [
        {
          action: "Resolve the identifier to a customer and their live session",
          query: renderSparql(SPARQL_TEMPLATES.customerTrace, {
            customer: "customer/88213",
            from: "2026-08-26T14:00:00Z",
            to: T.now,
          }),
          finding: "One active session, nine interactions, two failed transactions.",
          evidenceIds: ["ev-049"],
          durationMs: 62,
        },
        {
          action: "Join interactions to distributed traces",
          finding: "Trace 4f3a91c8b27d40e6 carries the failure: 8,214 ms, terminal error in Payment Service.",
          evidenceIds: ["ev-014"],
          durationMs: 118,
        },
        {
          action: "Attribute the failure to a cause",
          finding: "Pool acquisition timeout at 8,001 ms, with the pool at 97% since 14:29:40 UTC.",
          evidenceIds: ["ev-006", "ev-003"],
          durationMs: 141,
        },
      ],
      48,
      3_140,
    ),
    limitations: [
      "Session replay is sampled at 2% and no replay exists for this session.",
      "Whether this customer returns to complete the basket cannot be known yet.",
    ],
    relatedEntityIds: ["cust-88213", "jny-checkout", "svc-payment-service", "db-payments-primary"],
  };
}

function whatShouldIDoAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "Roll back pay-2026.08.26.4 on the canary pods. That single action restores the connection ceiling to 240 and is modelled to return checkout success to above 98% within 8–12 minutes — which matters because the US evening peak begins at 16:00 UTC and historically carries 2.4× the current transaction rate. In parallel, revert the eu-central routing change to recover European search. Neither action requires a code change.",
    citations: citations([
      ["ev-050", "The prior release ran 41 days at 52% pool utilisation."],
      ["ev-015", "Pausing the rollout stopped the climb but did not recover the affected pods."],
      ["ev-055", "Peak trading begins in 48 minutes at 2.4× current volume."],
      ["ev-024", "The eu-central routing change is revertible."],
    ]),
    evidence: evidenceByIds(["ev-050", "ev-015", "ev-055", "ev-024", "ev-005"]),
    recommendations: [
      RECOMMENDATIONS_BY_ID.get("rec-rollback-payments")!,
      RECOMMENDATIONS_BY_ID.get("rec-revert-bgp")!,
      RECOMMENDATIONS_BY_ID.get("rec-align-retry-ttl")!,
      RECOMMENDATIONS_BY_ID.get("rec-pool-guardrail")!,
    ],
    followUps: [
      "Why is checkout failing?",
      "What could break next?",
      "Show me the evidence for the rollback",
    ],
    confidence: confidence(
      0.86,
      "The prior configuration is known-good under comparable load. Residual risk is whatever else the release changed besides the pool.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Rank open issues by business impact",
          finding: "INC-4417 dominates: $4.69M at risk against $812K for INC-4416.",
          evidenceIds: ["ev-010", "ev-026"],
          durationMs: 74,
        },
        {
          action: "Identify the shortest reversible action per issue",
          finding: "Both leading issues are configuration changes with known-good prior states.",
          evidenceIds: ["ev-050", "ev-024"],
          durationMs: 136,
        },
        {
          action: "Check the timing constraint",
          finding: "Peak begins at 16:00 UTC at 2.4× volume, so the rollback should land inside the next 30 minutes.",
          evidenceIds: ["ev-055"],
          durationMs: 58,
        },
      ],
      142,
      8_600,
    ),
    limitations: [
      "Recovery timings are modelled from prior incidents with comparable rollbacks, not guaranteed.",
      "Rolling back also reverts the idempotency-key work in the same release, which Payments Engineering will need to reland.",
    ],
    relatedEntityIds: ["chg-8841", "svc-payment-service", "chg-8836", "rtr-core-euc1"],
  };
}

function dependencyAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "Four applications read or write the payments primary database: Payments Platform directly, and Checkout API, Order Management and Subscriptions Platform transitively through Payment Service. Two services share the same connection pool — Payment Service and Risk Engine — which is why pool pressure today degraded both at once.",
    citations: citations([
      ["ev-033", "Payment Service persists to the payments primary on every authorisation."],
      ["ev-034", "Four journeys reach the database through the dependency closure."],
      ["ev-016", "Risk Engine shares the same pool and was amplified by the pressure."],
    ]),
    evidence: evidenceByIds(["ev-033", "ev-034", "ev-016", "ev-054"]),
    recommendations: [RECOMMENDATIONS_BY_ID.get("rec-shed-risk-engine")!],
    followUps: ["If this database fails, what breaks?", "Open the digital map", "Which journeys are at risk?"],
    confidence: confidence(0.94, "Each hop is trace-observed; only the transitive closure itself is inferred."),
    investigation: investigation(
      question,
      [
        {
          action: "Resolve the entity and invert its dependency edges",
          query: renderSparql(SPARQL_TEMPLATES.journeysDependingOnEntity, { entity: "database/payments-primary" }),
          finding: "Direct dependants: Payment Service, Risk Engine. Transitive: Checkout, Orders, Subscriptions.",
          evidenceIds: ["ev-033", "ev-034"],
          durationMs: 108,
        },
      ],
      18,
      4_200,
    ),
    limitations: ["Dependencies that have never carried traffic in the observation window are invisible to the graph."],
    relatedEntityIds: ["db-payments-primary", "svc-payment-service", "svc-risk-engine", "app-payments", "app-checkout"],
  };
}

function whatCouldBreakAnswer(question: string): AskAnswer {
  return {
    ...base(question),
    executiveSummary:
      "The clearest emerging risk is the orders database: connection pool utilisation has climbed from 48% to 68% over 30 days at flat transaction volume, projecting to its alert threshold in about nine days — inside the autumn peak. That is the same failure mode as today's incident, on a second mission-critical journey. Behind it: European search still has no availability-zone redundancy, and the change failure rate has risen from 11.2% to 18.4% month over month.",
    citations: citations([
      ["ev-039", "Orders pool utilisation rose from 48% to 68% over 30 days."],
      ["ev-040", "Projected to reach the alert threshold in nine days."],
      ["ev-041", "All eight EU search index nodes sit in one availability zone."],
      ["ev-045", "Change failure rate rose to 18.4%."],
    ]),
    evidence: evidenceByIds(["ev-039", "ev-040", "ev-041", "ev-045", "ev-053", "ev-054"]),
    recommendations: [
      RECOMMENDATIONS_BY_ID.get("rec-orders-pool-headroom")!,
      RECOMMENDATIONS_BY_ID.get("rec-spread-search-index")!,
      RECOMMENDATIONS_BY_ID.get("rec-pool-guardrail")!,
    ],
    followUps: ["Open emerging risks", "If the orders database fails, what breaks?", "Show me change quality"],
    confidence: confidence(
      0.58,
      "Each leading indicator is observed, but the projections are linear extrapolations over 30 days and seasonality could move them in either direction.",
    ),
    investigation: investigation(
      question,
      [
        {
          action: "Scan saturation trends across data-tier entities",
          finding: "Orders primary is the only store with a sustained upward pool trend at flat volume.",
          evidenceIds: ["ev-039"],
          durationMs: 184,
        },
        {
          action: "Project each trend against its alert threshold",
          finding: "Nine days to threshold at the current slope.",
          evidenceIds: ["ev-040"],
          durationMs: 96,
        },
        {
          action: "Cross-check structural exposures in the graph",
          finding: "Single-AZ search index and single-path checkout authorisation both remain unmitigated.",
          evidenceIds: ["ev-041", "ev-054"],
          durationMs: 148,
        },
      ],
      284,
      31_400,
    ),
    limitations: [
      "Projections assume the last 30 days are representative; a promotional peak would bring the date forward.",
      "Risks that have never produced a leading indicator cannot be surfaced this way.",
    ],
    relatedEntityIds: ["db-orders-primary", "vm-search-index-euc1-a", "app-payments", "jny-checkout"],
  };
}

function slowSiteAnswer(question: string): AskAnswer {
  const answer = checkoutCauseAnswer(question);
  return {
    ...answer,
    executiveSummary:
      "Two separate things are making the site slow, and they are unrelated. Globally, checkout is slow because Payment Service is holding requests for 8 seconds waiting on database connections — that is the Sev 1, affecting 18,420 customers with $4.69M at risk. In Europe only, search is slow because a routing change moved traffic onto a lossy network path, affecting a further 41,200 customers. The web storefront itself is healthy: its 1.84 s p95 is entirely inherited from the two backends.",
    citations: citations([
      ["ev-002", "Payment Service p95 is 7,640 ms against a 910 ms baseline."],
      ["ev-021", "European search p95 is 1,412 ms against 486 ms."],
      ["ev-001", "Checkout success rate fell to 71.4%."],
      ["ev-027", "41,200 European customers saw degraded search."],
    ]),
    evidence: evidenceByIds(["ev-002", "ev-021", "ev-001", "ev-027", "ev-003", "ev-022", "ev-019"]),
    followUps: [
      "Why is checkout failing?",
      "Why are European customers seeing latency?",
      "How many customers are affected?",
    ],
    limitations: [
      ...answer.limitations,
      "This answer combines two independent incidents; treat their figures separately rather than adding them.",
    ],
    relatedEntityIds: ["app-storefront-web", "app-payments", "app-search", "inc-4417", "inc-4416"],
  };
}

/* ------------------------------ Intent table ------------------------------ */

const INTENTS: Intent[] = [
  {
    id: "checkout-cause",
    patterns: [
      ["checkout", "why"],
      ["checkout", "revenue"],
      ["checkout", "drop"],
      ["checkout", "fail"],
      ["payment", "why"],
      ["payment", "fail"],
      ["payment", "slow"],
    ],
    build: (q) => checkoutCauseAnswer(q),
  },
  {
    id: "europe-latency",
    patterns: [
      ["europe", "latency"],
      ["european", "latency"],
      ["eu", "search"],
      ["search", "slow"],
      ["europe", "slow"],
    ],
    build: (q) => europeLatencyAnswer(q),
  },
  {
    id: "site-slow",
    patterns: [
      ["website", "slow"],
      ["site", "slow"],
      ["app", "slow"],
      ["everything", "slow"],
    ],
    build: (q) => slowSiteAnswer(q),
  },
  {
    id: "customers-affected",
    patterns: [
      ["how many", "customer"],
      ["customers", "affected"],
      ["customer", "impact"],
    ],
    build: (q) => customersAffectedAnswer(q),
  },
  {
    id: "trace-customer",
    patterns: [["trace"], ["@"], ["customer", "session"]],
    build: (q) => traceCustomerAnswer(q),
  },
  {
    id: "what-changed",
    patterns: [["what changed"], ["changed", "before"], ["change", "incident"], ["deploy"]],
    build: (q) => whatChangedAnswer(q),
  },
  {
    id: "dependency",
    patterns: [["depend"], ["connected to"], ["what uses"]],
    build: (q) => dependencyAnswer(q),
  },
  {
    id: "blast-radius",
    patterns: [["if", "fail"], ["blast"], ["breaks"], ["what happens if"]],
    build: (q) => blastRadiusAnswer(q),
  },
  {
    id: "top-problems",
    patterns: [["top", "problem"], ["biggest", "impact"], ["worst", "application"], ["revenue impact"]],
    build: (q) => topProblemsAnswer(q),
  },
  {
    id: "what-next",
    patterns: [["could break"], ["emerging"], ["risk"], ["next"]],
    build: (q) => whatCouldBreakAnswer(q),
  },
  {
    id: "what-to-do",
    patterns: [["what should"], ["do now"], ["recommend"], ["fix"]],
    build: (q) => whatShouldIDoAnswer(q),
  },
];

function fallbackAnswer(question: string): AskAnswer {
  const answer = customersAffectedAnswer(question);
  return {
    ...answer,
    executiveSummary:
      "I could not resolve that question to a specific entity or journey, so here is the state of the app right now. 24,780 customers are affected across three open incidents, with $6.24M of transaction value modelled as at risk. The dominant issue is a Sev 1 on Complete Checkout caused by a Payment Service deployment.",
    limitations: [
      "This is a general answer: the question did not resolve to a specific journey, application, customer or entity.",
      "Try naming a journey (Checkout), an application (Payments Platform), a region (Europe), or paste a customer email or trace id.",
      ...answer.limitations,
    ],
    confidence: confidence(0.4, "The underlying figures are reliable, but this answer may not address what was actually asked."),
  };
}

export function answerQuestion(question: string, rangeKey: TimeRangeKey): AskAnswer {
  const q = question.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.patterns.some((group) => group.every((term) => q.includes(term)))) {
      return intent.build(question, rangeKey);
    }
  }
  return fallbackAnswer(question);
}

export const ASK_SUGGESTIONS: AskSuggestion[] = [
  {
    id: "sug-checkout",
    question: "Why did checkout revenue drop?",
    category: "cause",
    context: "Complete Checkout is at 71.4% success — a Sev 1 opened 37 minutes ago.",
  },
  {
    id: "sug-customers",
    question: "How many customers are affected right now?",
    category: "impact",
    context: "24,780 customers across three open incidents.",
  },
  {
    id: "sug-changed",
    question: "What changed before this incident?",
    category: "change",
    context: "Three changes landed today; one touched the payment path.",
  },
  {
    id: "sug-europe",
    question: "Why are customers in Europe experiencing latency?",
    category: "cause",
    context: "EU search p95 is 2.9× baseline since 11:05 UTC.",
  },
  {
    id: "sug-trace",
    question: "Trace customer@company.com",
    category: "trace",
    context: "A premier customer with a $1,284 basket that failed twice.",
  },
  {
    id: "sug-blast",
    question: "If the payments database fails, which business journeys are affected?",
    category: "risk",
    context: "Four journeys depend on it, with no observed failover.",
  },
  {
    id: "sug-top",
    question: "What are the top five technology problems by revenue impact?",
    category: "impact",
    context: "Payments accounts for 41% of quarterly value at risk.",
  },
  {
    id: "sug-next",
    question: "What could break next?",
    category: "risk",
    context: "The orders database is nine days from its alert threshold.",
  },
  {
    id: "sug-action",
    question: "What should I do now?",
    category: "action",
    context: "Peak trading begins in 48 minutes at 2.4× current volume.",
  },
  {
    id: "sug-depends",
    question: "Which applications depend on the payments database?",
    category: "cause",
    context: "Four applications, two sharing a single connection pool.",
  },
];
