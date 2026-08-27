import type { Evidence, EvidenceKind, EvidenceSource, Provenance, SourceSystem } from "@/types";
import { confidence } from "./primitives";
import { T } from "./narrative";

function source(
  id: string,
  system: SourceSystem,
  category: EvidenceSource["category"],
  reference: string,
  latencySeconds: number,
  trust: EvidenceSource["trust"] = "authoritative",
  ingestedAt = T.now,
): EvidenceSource {
  return { id, system, category, reference, ingestedAt, latencySeconds, trust };
}

const S = {
  datadogApm: source("src-datadog", "Datadog", "apm", "apm/service/payment-service/p95", 42),
  datadogDb: source("src-datadog", "Datadog", "infrastructure", "dashboard/aurora-payments/connections", 42),
  datadogCheckout: source("src-datadog", "Datadog", "apm", "apm/service/checkout-orchestrator/errors", 42),
  dynatrace: source("src-dynatrace", "Dynatrace", "apm", "ui/services/SERVICE-4F19A/rum", 65),
  splunk: source("src-splunk", "Splunk", "logs", "search?q=index=payments error=pool_timeout", 88),
  otel: source("src-otel", "OpenTelemetry", "tracing", "trace/4f3a91c8b27d40e6", 18),
  cloudwatch: source("src-aws", "AWS CloudWatch", "infrastructure", "metrics/AWS/RDS/DatabaseConnections", 120),
  gcp: source("src-gcp", "Google Cloud Operations", "infrastructure", "monitoring/dashboards/search-apse1", 2_280, "advisory"),
  opmanager: source("src-manageengine", "ManageEngine OpManager", "network", "device/core-rtr-euc1-01/interfaces", 95),
  appmanager: source("src-appmanager", "ManageEngine AppManager", "apm", "monitor/payment-service/transactions", 55),
  thousandeyes: source("src-thousandeyes", "ThousandEyes", "network", "tests/eu-central-storefront/path-visualisation", 74),
  panorama: source("src-panorama", "Palo Alto Panorama", "security", "policies/fw-edge-euc1/rule-482", 210),
  github: source("src-github", "GitHub Actions", "change", "nike/payments/actions/runs/8841", 30),
  servicenow: source("src-servicenow", "ServiceNow", "change", "change_request.do?sys_id=CHG-8841", 300),
  ledger: source("src-ledger", "Stripe Ledger", "business", "ledger/authorisations?window=14:31-15:12", 240),
  orders: source("src-orders", "Nike Order Service", "business", "orders/failed?window=14:33-15:12", 35),
  graph: source("src-graph", "APPX Graph", "graph", "graph/assertion", 2, "corroborating"),
} as const;

interface EvidenceInput {
  handle: string;
  title: string;
  statement: string;
  kind: EvidenceKind;
  provenance: Provenance;
  observedAt: string;
  windowFrom?: string;
  windowTo?: string;
  source: EvidenceSource;
  subjectIds: string[];
  assertion?: { subject: string; predicate: string; object: string };
  measurement?: Evidence["measurement"];
  excerpt?: string;
  related?: string[];
  confidenceValue?: number;
  confidenceRationale?: string;
  severity?: Evidence["severity"];
}

function ev(id: string, input: EvidenceInput): Evidence {
  return {
    id,
    handle: input.handle,
    title: input.title,
    statement: input.statement,
    kind: input.kind,
    provenance: input.provenance,
    confidence:
      input.confidenceValue !== undefined
        ? confidence(input.confidenceValue, input.confidenceRationale ?? "")
        : undefined,
    observedAt: input.observedAt,
    window:
      input.windowFrom && input.windowTo
        ? { from: input.windowFrom, to: input.windowTo }
        : undefined,
    source: input.source,
    subjectIds: input.subjectIds,
    assertion: input.assertion,
    measurement: input.measurement,
    excerpt: input.excerpt,
    relatedEvidenceIds: input.related ?? [],
    severity: input.severity,
  };
}

/**
 * The evidence corpus.
 *
 * Every claim the product makes — a headline number, a causal attribution, a
 * recommendation — resolves to records in here. Handles (E1, E2, …) are stable
 * and global, so the same fact carries the same handle in an Ask answer, an
 * incident timeline and the evidence explorer.
 */
export const EVIDENCE: Evidence[] = [
  // ---- Scenario 1: checkout degradation -----------------------------------
  ev("ev-001", {
    handle: "E1",
    title: "Checkout journey success rate fell 27.8 points",
    statement:
      "Complete Checkout success rate dropped from 99.2% to 71.4% between 14:33 and 14:41 UTC and has not recovered.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.journeyDegraded,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.datadogCheckout,
    subjectIds: ["jny-checkout", "app-checkout"],
    measurement: { label: "Journey success rate", value: 71.4, unit: "pct", baseline: 99.2, deltaPct: -28.0 },
    related: ["ev-002", "ev-011"],
    severity: "sev1",
  }),
  ev("ev-002", {
    handle: "E2",
    title: "Payment Service p95 latency increased 8.4×",
    statement:
      "Payment Service p95 response time rose from 910 ms to 7,640 ms starting 14:31:12 UTC, two minutes before checkout degraded.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.paymentLatency,
    windowFrom: T.paymentLatency,
    windowTo: T.now,
    source: S.datadogApm,
    subjectIds: ["svc-payment-service", "app-payments"],
    measurement: { label: "p95 latency", value: 7_640, unit: "ms", baseline: 910, deltaPct: 739.6 },
    related: ["ev-003", "ev-004"],
    severity: "sev1",
  }),
  ev("ev-003", {
    handle: "E3",
    title: "Payments database connection pool at 97% utilisation",
    statement:
      "Aurora connection pool utilisation on nike-payments-primary crossed 85% at 14:29:40 UTC and reached 97%, where it remains.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.poolSaturation,
    windowFrom: T.poolSaturation,
    windowTo: T.now,
    source: S.cloudwatch,
    subjectIds: ["db-payments-primary", "rds-payments-primary"],
    measurement: { label: "Connection pool utilisation", value: 97, unit: "pct", baseline: 52, deltaPct: 86.5 },
    related: ["ev-004", "ev-005"],
    severity: "sev1",
  }),
  ev("ev-004", {
    handle: "E4",
    title: "Deployment pay-2026.08.26.4 reached 25% of payment pods",
    statement:
      "A canary deployment of Payment Service version pay-2026.08.26.4 began at 14:26:00 UTC and reached 25% rollout at 14:29:12 UTC.",
    kind: "change-record",
    provenance: "observed",
    observedAt: T.deploy,
    source: S.github,
    subjectIds: ["chg-8841", "svc-payment-service", "ctr-payment-service-a", "ctr-payment-service-b"],
    excerpt:
      "run 8841 · strategy=canary · rollout=25% · pods=24/96 · image=payments:pay-2026.08.26.4\nchanged: src/db/pool.ts, src/authorise/handler.ts, config/pool.yaml",
    related: ["ev-005", "ev-003"],
  }),
  ev("ev-005", {
    handle: "E5",
    title: "Connection pool ceiling lowered from 240 to 60 per pod",
    statement:
      "The deployment changed maxPoolSize from 240 to 60 in config/pool.yaml. At the current pod count this reduces available payment connections by 62%.",
    kind: "config-snapshot",
    provenance: "observed",
    observedAt: T.deploy,
    source: S.github,
    subjectIds: ["chg-8841", "svc-payment-service"],
    excerpt:
      "- pool:\n-   maxPoolSize: 240\n-   acquireTimeoutMs: 8000\n+ pool:\n+   maxPoolSize: 60\n+   acquireTimeoutMs: 8000",
    related: ["ev-003", "ev-004"],
    severity: "sev1",
  }),
  ev("ev-006", {
    handle: "E6",
    title: "Pool acquisition timeouts in payment logs",
    statement:
      "18,412 pool_timeout errors logged by Payment Service since 14:31 UTC, none in the preceding 24 hours.",
    kind: "log",
    provenance: "observed",
    observedAt: "2026-08-26T14:31:44.000Z",
    windowFrom: T.paymentLatency,
    windowTo: T.now,
    source: S.splunk,
    subjectIds: ["svc-payment-service", "db-payments-primary"],
    measurement: { label: "pool_timeout events", value: 18_412, unit: "count", baseline: 0 },
    excerpt:
      '14:31:44.812Z ERROR payment-service pool_timeout acquire=8001ms poolSize=60 waiting=214 orderId=ord-88241093\n14:31:44.907Z ERROR payment-service pool_timeout acquire=8003ms poolSize=60 waiting=218 orderId=ord-88241096',
    related: ["ev-003", "ev-005"],
    severity: "sev1",
  }),
  ev("ev-007", {
    handle: "E7",
    title: "21,860 checkout transactions failed or abandoned",
    statement:
      "The order service recorded 21,860 checkout transactions that failed or were abandoned at the payment step between 14:33 and 15:12 UTC.",
    kind: "transaction",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.orders,
    subjectIds: ["jny-checkout", "app-orders"],
    measurement: { label: "Failed transactions", value: 21_860, unit: "count", baseline: 1_240 },
    related: ["ev-008", "ev-009"],
    severity: "sev1",
  }),
  ev("ev-008", {
    handle: "E8",
    title: "18,420 distinct customers affected",
    statement:
      "18,420 distinct customer identities encountered a failed or abandoned checkout in the window, deduplicated across sessions and devices.",
    kind: "transaction",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.orders,
    subjectIds: ["jny-checkout"],
    measurement: { label: "Distinct customers", value: 18_420, unit: "count" },
    related: ["ev-007"],
    severity: "sev1",
  }),
  ev("ev-009", {
    handle: "E9",
    title: "Trailing 7-day average order value is $214.60",
    statement:
      "Average completed order value across the trailing seven days is $214.60, computed from 6.9M settled ledger entries.",
    kind: "revenue-record",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: "2026-08-19T15:12:00.000Z",
    windowTo: T.now,
    source: S.ledger,
    subjectIds: ["jny-checkout"],
    measurement: { label: "Average order value", value: 214.6, unit: "currency" },
    related: ["ev-007", "ev-010"],
  }),
  ev("ev-010", {
    handle: "E10",
    title: "$4.69M transaction value modelled as at risk",
    statement:
      "21,860 failed or abandoned transactions × $214.60 average order value = $4.69M. This is a modelled figure, not settled revenue.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.graph,
    subjectIds: ["jny-checkout"],
    measurement: { label: "Estimated value at risk", value: 4_691_000, unit: "currency" },
    confidenceValue: 0.82,
    confidenceRationale:
      "Both inputs are observed. Uncertainty is recovery behaviour: historically 31–46% of abandoned baskets are recovered within 24 hours, so the settled loss will be lower.",
    related: ["ev-007", "ev-009", "ev-012"],
  }),
  ev("ev-011", {
    handle: "E11",
    title: "Checkout depends on Payment Service for authorisation",
    statement:
      "Distributed traces show 99.4% of Complete Checkout sessions calling Payment Service at the authorisation step.",
    kind: "graph-assertion",
    provenance: "observed",
    observedAt: "2026-08-26T00:00:00.000Z",
    source: S.otel,
    subjectIds: ["jny-checkout", "svc-payment-service"],
    assertion: { subject: "journey/checkout", predicate: "appx:servedBy", object: "service/payment-service" },
    measurement: { label: "Trace coverage", value: 99.4, unit: "pct" },
    related: ["ev-002"],
  }),
  ev("ev-012", {
    handle: "E12",
    title: "$912.3K of settled revenue reversed or lost",
    statement:
      "The revenue ledger recorded $912,300 in authorisation reversals and failed captures attributable to the incident window.",
    kind: "revenue-record",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.ledger,
    subjectIds: ["jny-checkout", "app-payments"],
    measurement: { label: "Observed value lost", value: 912_300, unit: "currency" },
    related: ["ev-010"],
    severity: "sev1",
  }),
  ev("ev-013", {
    handle: "E13",
    title: "Deployment precedes degradation by 5 minutes 12 seconds",
    statement:
      "The gap between the pay-2026.08.26.4 canary reaching 25% and the first pool saturation reading is 28 seconds; the gap to journey degradation is 7 minutes.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.journeyDegraded,
    source: S.graph,
    subjectIds: ["chg-8841", "jny-checkout", "svc-payment-service"],
    confidenceValue: 0.91,
    confidenceRationale:
      "Ordering is unambiguous and the changed file is the pool configuration itself. No other change touched the payment path in the preceding 6 hours.",
    related: ["ev-004", "ev-005", "ev-003"],
  }),
  ev("ev-014", {
    handle: "E14",
    title: "Traced checkout failure for a single customer",
    statement:
      "Trace 4f3a91c8b27d40e6 shows a checkout request reaching Checkout API at 14:37:21 UTC and timing out after 8,214 ms inside Payment Service.",
    kind: "trace",
    provenance: "observed",
    observedAt: T.tracedFailure,
    source: S.otel,
    subjectIds: ["cust-88213", "svc-payment-service", "app-checkout"],
    excerpt:
      "checkout-orchestrator  POST /checkout/authorise      8,214ms  ERROR\n  payment-service      POST /v2/authorise            8,201ms  ERROR pool_timeout\n    payments-db        acquire connection            8,001ms  TIMEOUT",
    related: ["ev-006", "ev-002"],
    severity: "sev1",
  }),
  ev("ev-015", {
    handle: "E15",
    title: "Rollout paused at 25% at 14:52 UTC",
    statement:
      "Payments Engineering paused the canary at 14:52 UTC. Error rate stopped climbing but did not fall, because the affected pods still hold the reduced pool ceiling.",
    kind: "event",
    provenance: "observed",
    observedAt: T.rolloutPaused,
    source: S.github,
    subjectIds: ["chg-8841", "svc-payment-service"],
    related: ["ev-004"],
  }),
  ev("ev-016", {
    handle: "E16",
    title: "Risk Engine latency amplified by shared pool",
    statement:
      "Risk Engine p95 rose 3.1× over the same window. It shares the payments database pool and is a contributing factor rather than a cause.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.poolSaturation,
    source: S.appmanager,
    subjectIds: ["svc-risk-engine", "db-payments-primary"],
    measurement: { label: "p95 latency", value: 2_140, unit: "ms", baseline: 690, deltaPct: 210.1 },
    related: ["ev-003"],
  }),
  ev("ev-017", {
    handle: "E17",
    title: "Northbridge gateway is healthy throughout",
    statement:
      "The external payment gateway held 412 ms p95 and 0.6% errors across the window, ruling out a third-party cause.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.deploy,
    windowTo: T.now,
    source: S.datadogApm,
    subjectIds: ["svc-payment-gateway"],
    measurement: { label: "p95 latency", value: 412, unit: "ms", baseline: 408 },
    related: ["ev-002"],
  }),
  ev("ev-018", {
    handle: "E18",
    title: "Order commit latency doubled downstream of payments",
    statement:
      "Order Write Service p95 rose from 810 ms to 1,620 ms from 14:36 UTC as retries queued behind slow authorisations.",
    kind: "metric",
    provenance: "observed",
    observedAt: "2026-08-26T14:36:00.000Z",
    source: S.appmanager,
    subjectIds: ["svc-order-write", "app-orders"],
    measurement: { label: "p95 latency", value: 1_620, unit: "ms", baseline: 810, deltaPct: 100 },
    related: ["ev-002"],
  }),
  ev("ev-019", {
    handle: "E19",
    title: "Mobile checkout abandonment up 22 points",
    statement:
      "Real-user monitoring shows mobile checkout abandonment rising from 8.1% to 30.4% during the window, higher than web at 24.9%.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.journeyDegraded,
    windowTo: T.now,
    source: S.dynatrace,
    subjectIds: ["app-mobile", "jny-checkout"],
    measurement: { label: "Abandonment rate", value: 30.4, unit: "pct", baseline: 8.1, deltaPct: 275.3 },
    related: ["ev-001"],
  }),
  ev("ev-020", {
    handle: "E20",
    title: "US East carries 61% of affected customers",
    statement:
      "11,236 of 18,420 affected customers were served from us-east-1, consistent with the canary pod placement.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["jny-checkout", "aws-use1"],
    measurement: { label: "Share of affected customers", value: 61, unit: "pct" },
    confidenceValue: 0.88,
    confidenceRationale: "Region attribution comes from edge routing logs, which are complete for the window.",
    related: ["ev-008", "ev-004"],
  }),

  // ---- Scenario 2: EU search latency --------------------------------------
  ev("ev-021", {
    handle: "E21",
    title: "Search p95 in eu-central rose 2.9×",
    statement:
      "Search Query Service p95 in eu-central-1 rose from 486 ms to 1,412 ms from 11:05 UTC and remains elevated.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.euLatencyStart,
    windowFrom: T.euLatencyStart,
    windowTo: T.now,
    source: S.datadogApm,
    subjectIds: ["svc-search-query", "app-search"],
    measurement: { label: "p95 latency", value: 1_412, unit: "ms", baseline: 486, deltaPct: 190.5 },
    related: ["ev-022", "ev-023"],
    severity: "sev2",
  }),
  ev("ev-022", {
    handle: "E22",
    title: "Inter-AZ latency in eu-central-1 rose to 38.6 ms",
    statement:
      "Path measurements between euc1-az1b and the search index tier show round-trip latency rising from 1.4 ms to 38.6 ms.",
    kind: "metric",
    provenance: "observed",
    observedAt: "2026-08-26T11:02:00.000Z",
    source: S.thousandeyes,
    subjectIds: ["rtr-core-euc1", "aws-euc1"],
    measurement: { label: "Round-trip latency", value: 38.6, unit: "ms", baseline: 1.4, deltaPct: 2_657 },
    related: ["ev-023", "ev-024"],
    severity: "sev2",
  }),
  ev("ev-023", {
    handle: "E23",
    title: "Packet loss on core-rtr-euc1-01 Ethernet3/1",
    statement:
      "Interface Ethernet3/1 shows 0.68% packet loss and 142 errors per minute, starting within three minutes of a routing policy change.",
    kind: "metric",
    provenance: "observed",
    observedAt: "2026-08-26T10:51:00.000Z",
    source: S.opmanager,
    subjectIds: ["if-rtr-core-euc1-et3", "rtr-core-euc1"],
    measurement: { label: "Packet loss", value: 0.68, unit: "pct", baseline: 0.0 },
    related: ["ev-024"],
    severity: "sev2",
  }),
  ev("ev-024", {
    handle: "E24",
    title: "BGP local-preference change on the eu-central core router",
    statement:
      "Change CHG-8836 adjusted local-preference for the search prefix at 10:48 UTC, shifting traffic onto a longer intra-region path.",
    kind: "change-record",
    provenance: "observed",
    observedAt: T.euNetworkChange,
    source: S.servicenow,
    subjectIds: ["chg-8836", "rtr-core-euc1"],
    excerpt:
      "route-map SEARCH-PREF permit 10\n-  set local-preference 200\n+  set local-preference 90",
    related: ["ev-022", "ev-023"],
  }),
  ev("ev-025", {
    handle: "E25",
    title: "European search conversion fell 11.2%",
    statement:
      "Search-attributed basket adds in EU regions fell 11.2% against the trailing four-week same-hour baseline.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.euLatencyStart,
    windowTo: T.now,
    source: S.dynatrace,
    subjectIds: ["jny-search"],
    measurement: { label: "Search conversion", value: 7.46, unit: "pct", baseline: 8.4, deltaPct: -11.2 },
    related: ["ev-026"],
  }),
  ev("ev-026", {
    handle: "E26",
    title: "$812K search revenue contribution modelled as at risk",
    statement:
      "11.2% conversion loss applied to the EU search-attributed revenue run rate of $7.25M/day over 4.1 hours gives $812K.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["jny-search"],
    measurement: { label: "Estimated value at risk", value: 812_000, unit: "currency" },
    confidenceValue: 0.61,
    confidenceRationale:
      "Search-to-revenue attribution is a model, not a ledger fact: a customer who searched slowly may still convert later through another surface.",
    related: ["ev-025"],
  }),
  ev("ev-027", {
    handle: "E27",
    title: "41,200 EU customers experienced degraded search",
    statement:
      "41,200 distinct customers in eu-west and eu-central saw a search response above the 900 ms experience threshold.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.euLatencyStart,
    windowTo: T.now,
    source: S.dynatrace,
    subjectIds: ["jny-search"],
    measurement: { label: "Customers affected", value: 41_200, unit: "count" },
    related: ["ev-021"],
  }),
  ev("ev-028", {
    handle: "E28",
    title: "GCP asia-southeast telemetry is 38 minutes stale",
    statement:
      "The Google Cloud Operations feed last delivered at 14:34 UTC. Search health for ap-southeast is reported from Datadog only.",
    kind: "event",
    provenance: "observed",
    observedAt: "2026-08-26T14:34:00.000Z",
    source: S.gcp,
    subjectIds: ["gcp-apse1", "svc-search-query"],
    related: [],
    severity: "sev3",
  }),

  // ---- Scenario 3: subscription renewal -----------------------------------
  ev("ev-029", {
    handle: "E29",
    title: "Stored-credential refresh failure rate at 11.4%",
    statement:
      "Token refresh for stored payment credentials failed for 11.4% of renewal attempts from 07:12 UTC, against a 0.6% baseline.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.subscriptionStart,
    source: S.datadogApm,
    subjectIds: ["svc-identity-token", "app-subscriptions"],
    measurement: { label: "Refresh failure rate", value: 11.4, unit: "pct", baseline: 0.6, deltaPct: 1_800 },
    related: ["ev-030", "ev-031"],
    severity: "sev3",
  }),
  ev("ev-030", {
    handle: "E30",
    title: "Token TTL shortened from 24h to 1h",
    statement:
      "Change CHG-8829 reduced stored-credential token lifetime to one hour, forcing refreshes mid-batch for long-running renewal jobs.",
    kind: "config-snapshot",
    provenance: "observed",
    observedAt: T.subscriptionChange,
    source: S.servicenow,
    subjectIds: ["chg-8829", "svc-identity-token"],
    excerpt: "- storedCredentialTtl: 86400\n+ storedCredentialTtl: 3600",
    related: ["ev-029"],
  }),
  ev("ev-031", {
    handle: "E31",
    title: "3,180 memberships failed to renew",
    statement:
      "3,180 Nike memberships failed at least one renewal attempt. 2,410 have since succeeded on retry.",
    kind: "transaction",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: T.subscriptionStart,
    windowTo: T.now,
    source: S.ledger,
    subjectIds: ["jny-subscription-renew"],
    measurement: { label: "Failed renewals", value: 3_180, unit: "count", baseline: 180 },
    related: ["ev-029"],
  }),
  ev("ev-032", {
    handle: "E32",
    title: "Retry backlog draining since 09:30 UTC",
    statement:
      "After the retry window was widened at 09:30 UTC, renewal success recovered from 88.6% toward 96.2%.",
    kind: "event",
    provenance: "observed",
    observedAt: T.subscriptionMitigated,
    source: S.splunk,
    subjectIds: ["svc-subscription-billing"],
    related: ["ev-031"],
  }),

  // ---- Cross-cutting graph assertions -------------------------------------
  ev("ev-033", {
    handle: "E33",
    title: "Payment Service persists to the payments primary database",
    statement: "Observed in traces on every authorisation path; asserted with source OpenTelemetry.",
    kind: "graph-assertion",
    provenance: "observed",
    observedAt: "2026-08-26T00:00:00.000Z",
    source: S.otel,
    subjectIds: ["svc-payment-service", "db-payments-primary"],
    assertion: { subject: "service/payment-service", predicate: "appx:persistsTo", object: "database/payments-primary" },
    related: ["ev-003"],
  }),
  ev("ev-034", {
    handle: "E34",
    title: "Four journeys transitively depend on the payments database",
    statement:
      "Transitive closure of appx:dependsOn from the payments primary reaches Complete Checkout, Make a Payment, Renew Nike Membership and Redeem a Gift Card.",
    kind: "graph-assertion",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["db-payments-primary", "jny-checkout", "jny-payment", "jny-subscription-renew", "jny-gift-card"],
    confidenceValue: 0.94,
    confidenceRationale: "Each hop is trace-observed; only the closure itself is inferred.",
    related: ["ev-033"],
  }),
  ev("ev-035", {
    handle: "E35",
    title: "Payment traffic traverses fw-payments-dmz",
    statement:
      "Flow records show all Payment Service to gateway traffic passing the payments DMZ firewall.",
    kind: "graph-assertion",
    provenance: "observed",
    observedAt: "2026-08-26T00:00:00.000Z",
    source: S.panorama,
    subjectIds: ["svc-payment-service", "fw-payments-dmz"],
    assertion: { subject: "service/payment-service", predicate: "appx:routesThrough", object: "firewall/payments-dmz" },
    related: [],
  }),
  ev("ev-036", {
    handle: "E36",
    title: "No security policy change on the payment path",
    statement:
      "Panorama shows no rule modification on fw-payments-dmz in the 24 hours before the incident, ruling out a policy cause.",
    kind: "config-snapshot",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: "2026-08-25T15:12:00.000Z",
    windowTo: T.now,
    source: S.panorama,
    subjectIds: ["fw-payments-dmz"],
    related: ["ev-035"],
  }),
  ev("ev-037", {
    handle: "E37",
    title: "Checkout error budget exhausted",
    statement:
      "The Complete Checkout monthly error budget fell to 4% remaining at 14:41 UTC and reached 0% at 15:02 UTC.",
    kind: "metric",
    provenance: "observed",
    observedAt: "2026-08-26T15:02:00.000Z",
    source: S.datadogCheckout,
    subjectIds: ["jny-checkout"],
    measurement: { label: "Error budget remaining", value: 0, unit: "pct", baseline: 32 },
    related: ["ev-001"],
    severity: "sev1",
  }),
  ev("ev-038", {
    handle: "E38",
    title: "Payment pool ceiling is a recurring failure signature",
    statement:
      "Three of the last eleven payment incidents involved connection-pool exhaustion following a configuration change.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    windowFrom: "2026-05-26T00:00:00.000Z",
    windowTo: T.now,
    source: S.graph,
    subjectIds: ["svc-payment-service", "db-payments-primary"],
    measurement: { label: "Matching incidents", value: 3, unit: "count" },
    confidenceValue: 0.78,
    confidenceRationale: "Signature matching is lexical over post-incident summaries plus entity overlap.",
    related: ["ev-005"],
  }),
  ev("ev-039", {
    handle: "E39",
    title: "Orders database connection headroom narrowing",
    statement:
      "nike-orders-primary pool utilisation has trended from 48% to 68% over 30 days at constant transaction volume.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: "2026-07-27T15:12:00.000Z",
    windowTo: T.now,
    source: S.cloudwatch,
    subjectIds: ["db-orders-primary", "rds-orders-primary"],
    measurement: { label: "Connection pool utilisation", value: 68, unit: "pct", baseline: 48, deltaPct: 41.7 },
    related: ["ev-040"],
  }),
  ev("ev-040", {
    handle: "E40",
    title: "Orders database projected to saturate within 9 days",
    statement:
      "Linear extrapolation of the 30-day pool trend against the 85% alert threshold gives a 9-day horizon at current growth.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["db-orders-primary"],
    measurement: { label: "Days to threshold", value: 9, unit: "count" },
    confidenceValue: 0.58,
    confidenceRationale:
      "A linear fit over 30 days; the trend is steady but seasonal peaks and a planned index change could move it either way.",
    related: ["ev-039"],
  }),
  ev("ev-041", {
    handle: "E41",
    title: "Search index tier is single-AZ in eu-central",
    statement:
      "All eight search index nodes in eu-central-1 are placed in euc1-az1b, so an AZ-level network event affects the whole tier.",
    kind: "config-snapshot",
    provenance: "observed",
    observedAt: T.now,
    source: S.cloudwatch,
    subjectIds: ["vm-search-index-euc1-a", "k8s-search-euc1", "aws-euc1"],
    measurement: { label: "Nodes outside az1b", value: 0, unit: "count" },
    related: ["ev-022"],
  }),
  ev("ev-042", {
    handle: "E42",
    title: "Android 14 crash cluster on checkout entry",
    statement:
      "A crash signature in the basket surface affected 0.9% of Android 14 sessions between 25 Aug 18:20 and 26 Aug 02:10 UTC.",
    kind: "event",
    provenance: "observed",
    observedAt: T.mobileCrashStart,
    source: S.dynatrace,
    subjectIds: ["app-mobile", "inc-4411"],
    measurement: { label: "Crash rate", value: 0.9, unit: "pct", baseline: 0.08 },
    related: [],
  }),
  ev("ev-043", {
    handle: "E43",
    title: "CDN cache-miss storm on 24 Aug",
    statement:
      "A cache key change caused edge hit rate to fall from 94% to 41% for 85 minutes, driving origin load up 6.2×.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.cdnStormStart,
    windowFrom: T.cdnStormStart,
    windowTo: T.cdnStormEnd,
    source: S.datadogApm,
    subjectIds: ["svc-cdn-edge", "inc-4408"],
    measurement: { label: "Edge hit rate", value: 41, unit: "pct", baseline: 94 },
    related: [],
  }),
  ev("ev-044", {
    handle: "E44",
    title: "Carrier callbacks blocked by firewall rule 482",
    statement:
      "A tightened egress rule on fw-edge-euc1 dropped 100% of Meridian carrier callbacks for 2h15m on 19 Aug.",
    kind: "log",
    provenance: "observed",
    observedAt: T.firewallBlockStart,
    windowFrom: T.firewallBlockStart,
    windowTo: T.firewallBlockEnd,
    source: S.panorama,
    subjectIds: ["fw-edge-euc1", "svc-carrier-gateway", "inc-4392"],
    excerpt: "deny  from=carrier-net/22  to=10.42.8.0/24  rule=482  action=drop  count=184201",
    related: [],
  }),
  ev("ev-045", {
    handle: "E45",
    title: "Change failure rate is 18.4% over 30 days",
    statement:
      "Of 212 production changes in the last 30 days, 39 were followed by a correlated degradation within two hours.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    windowFrom: "2026-07-27T15:12:00.000Z",
    windowTo: T.now,
    source: S.graph,
    subjectIds: ["app-payments", "app-checkout", "app-search"],
    measurement: { label: "Change failure rate", value: 18.4, unit: "pct", baseline: 11.2, deltaPct: 64.3 },
    confidenceValue: 0.72,
    confidenceRationale:
      "Correlation window is two hours and topological; some of the 39 will be coincidental.",
    related: ["ev-013"],
  }),
  ev("ev-046", {
    handle: "E46",
    title: "Payments is the top revenue-impacting application this quarter",
    statement:
      "Payments Platform accounts for 41% of modelled value at risk across all incidents in the quarter to date.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    windowFrom: "2026-07-01T00:00:00.000Z",
    windowTo: T.now,
    source: S.graph,
    subjectIds: ["app-payments"],
    measurement: { label: "Share of value at risk", value: 41, unit: "pct" },
    confidenceValue: 0.76,
    confidenceRationale: "Aggregates modelled per-incident estimates, so it inherits their uncertainty.",
    related: ["ev-010", "ev-038"],
  }),
  ev("ev-047", {
    handle: "E47",
    title: "Experience score down 6.4 points month over month",
    statement:
      "The composite experience score across all journeys fell from 87.2 to 80.8 over 30 days.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: "2026-07-27T15:12:00.000Z",
    windowTo: T.now,
    source: S.dynatrace,
    subjectIds: ["jny-checkout", "jny-search", "jny-login"],
    measurement: { label: "Experience score", value: 80.8, unit: "score", baseline: 87.2, deltaPct: -7.3 },
    related: ["ev-001", "ev-021"],
  }),
  ev("ev-048", {
    handle: "E48",
    title: "Customer cust-88213 completed 14 prior checkouts without failure",
    statement:
      "The traced customer has a 100% checkout success rate across 14 attempts in the preceding 90 days.",
    kind: "transaction",
    provenance: "observed",
    observedAt: T.now,
    windowFrom: "2026-05-28T15:12:00.000Z",
    windowTo: T.now,
    source: S.orders,
    subjectIds: ["cust-88213"],
    measurement: { label: "Prior successful checkouts", value: 14, unit: "count" },
    related: ["ev-014"],
  }),
  ev("ev-049", {
    handle: "E49",
    title: "Session cust-88213 experience score fell to 12",
    statement:
      "The customer's live session scored 12 of 100, driven by an 8.2 s wait and a terminal error at the payment step.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.tracedFailure,
    source: S.dynatrace,
    subjectIds: ["cust-88213", "ses-88213-a"],
    measurement: { label: "Session experience score", value: 12, unit: "score", baseline: 91 },
    related: ["ev-014"],
    severity: "sev1",
  }),
  ev("ev-050", {
    handle: "E50",
    title: "Rollback of pay-2026.08.26.4 is expected to restore pool capacity",
    statement:
      "Reverting the canary returns maxPoolSize to 240 on all pods. The prior release ran 41 days at 52% pool utilisation.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["chg-8841", "svc-payment-service"],
    confidenceValue: 0.86,
    confidenceRationale:
      "The prior configuration is known-good under comparable load. Residual risk is whatever the release changed besides the pool.",
    related: ["ev-005", "ev-015"],
  }),
  ev("ev-051", {
    handle: "E51",
    title: "Checkout is served by six applications",
    statement:
      "Trace analysis attributes Complete Checkout to Web Storefront, Mobile App, Checkout API, Payments Platform, Order Management and Notifications.",
    kind: "graph-assertion",
    provenance: "derived",
    observedAt: "2026-08-26T00:00:00.000Z",
    source: S.graph,
    subjectIds: ["jny-checkout"],
    confidenceValue: 0.96,
    confidenceRationale: "Each attribution is supported by at least 10,000 traces in the last 24 hours.",
    related: ["ev-011"],
  }),
  ev("ev-052", {
    handle: "E52",
    title: "Revenue feed lags the experience feed by four minutes",
    statement:
      "The revenue ledger last settled at 15:08 UTC. Figures for the final four minutes of the window are experience-derived only.",
    kind: "event",
    provenance: "observed",
    observedAt: "2026-08-26T15:08:00.000Z",
    source: S.ledger,
    subjectIds: ["jny-checkout", "jny-payment"],
    related: ["ev-012"],
  }),
  ev("ev-053", {
    handle: "E53",
    title: "Frankfurt packet loss recurred three times in 30 days",
    statement:
      "core-rtr-euc1-01 has shown loss above 0.5% on 17, 21 and 26 August, each time following a routing policy change.",
    kind: "correlation",
    provenance: "derived",
    observedAt: T.now,
    windowFrom: "2026-07-27T15:12:00.000Z",
    windowTo: T.now,
    source: S.graph,
    subjectIds: ["rtr-core-euc1"],
    measurement: { label: "Recurrences", value: 3, unit: "count" },
    confidenceValue: 0.81,
    confidenceRationale: "All three are directly observed; only the common-cause grouping is inferred.",
    related: ["ev-023", "ev-024"],
  }),
  ev("ev-054", {
    handle: "E54",
    title: "Checkout has no failover path for payment authorisation",
    statement:
      "The graph finds no alternative authorisation route: every checkout completion depends on Payment Service reaching the primary database.",
    kind: "graph-assertion",
    provenance: "derived",
    observedAt: T.now,
    source: S.graph,
    subjectIds: ["jny-checkout", "svc-payment-service", "db-payments-primary"],
    confidenceValue: 0.89,
    confidenceRationale:
      "Derived from the absence of an observed alternative path over 90 days of traces; an untested failover could exist but has never carried traffic.",
    related: ["ev-034"],
  }),
  ev("ev-055", {
    handle: "E55",
    title: "Peak trading window begins in 48 minutes",
    statement:
      "US evening peak begins at 16:00 UTC and historically carries 2.4× the current transaction rate.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.now,
    source: S.orders,
    subjectIds: ["jny-checkout"],
    measurement: { label: "Peak multiplier", value: 2.4, unit: "ratio" },
    related: ["ev-007"],
  }),
  ev("ev-056", {
    handle: "E56",
    title: "Session replay unavailable for the incident window",
    statement:
      "Session replay capture is sampled at 2% and no replay exists for the majority of affected sessions.",
    kind: "event",
    provenance: "observed",
    observedAt: T.now,
    source: S.dynatrace,
    subjectIds: ["jny-checkout"],
    related: [],
  }),
  ev("ev-057", {
    handle: "E57",
    title: "Token issuance p95 rose 900 ms during the session store failover",
    statement:
      "Token Service p95 moved from 780 ms to 1,680 ms for 85 minutes while the session store completed a managed failover on 23 August.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.identityLatencyStart,
    windowFrom: T.identityLatencyStart,
    windowTo: T.identityLatencyEnd,
    source: S.dynatrace,
    subjectIds: ["svc-identity-token", "cache-session-store", "inc-4405"],
    measurement: { label: "p95 latency", value: 1_680, unit: "ms", baseline: 780, deltaPct: 115.4 },
    related: [],
    severity: "sev2",
  }),
  ev("ev-058", {
    handle: "E58",
    title: "Order events consumer lag reached 41 seconds",
    statement:
      "Consumer lag on the order-events topic rose from under 1 second to 41 seconds during the 21 August promotional spike, delaying fulfilment handoff.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.queueBacklogStart,
    windowFrom: T.queueBacklogStart,
    windowTo: T.queueBacklogEnd,
    source: S.datadogApm,
    subjectIds: ["q-order-events", "msk-order-events", "inc-4399"],
    measurement: { label: "Consumer lag", value: 41, unit: "count", baseline: 0.8 },
    related: [],
    severity: "sev2",
  }),
  ev("ev-059", {
    handle: "E59",
    title: "Pricing Engine old-generation heap grew 180 MB per hour",
    statement:
      "Heap growth began at the pri-2026.08.14.2 release and stopped on rollback, with no corresponding rise in request volume.",
    kind: "metric",
    provenance: "observed",
    observedAt: T.pricingLeakStart,
    windowFrom: T.pricingLeakStart,
    windowTo: T.pricingLeakEnd,
    source: S.datadogApm,
    subjectIds: ["svc-pricing-engine", "vm-pricing-use1-a", "inc-4380"],
    measurement: { label: "Heap growth", value: 180, unit: "count", baseline: 0 },
    related: [],
    severity: "sev3",
  }),
];

export const EVIDENCE_BY_ID = new Map(EVIDENCE.map((e) => [e.id, e]));
export const EVIDENCE_BY_HANDLE = new Map(EVIDENCE.map((e) => [e.handle, e]));

export function evidenceByIds(ids: string[]): Evidence[] {
  return ids.map((id) => EVIDENCE_BY_ID.get(id)).filter((e): e is Evidence => Boolean(e));
}

export function evidenceForSubject(subjectId: string): Evidence[] {
  return EVIDENCE.filter((e) => e.subjectIds.includes(subjectId));
}
