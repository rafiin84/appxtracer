import type { EmergingRisk, Recommendation, RootCause } from "@/types";
import { T } from "./narrative";
import { confidence, usd } from "./primitives";

/**
 * Causal attributions.
 *
 * A root cause is never asserted without a confidence and a linked evidence
 * set — the SHACL shape `appx:RootCauseShape` makes that a hard constraint, and
 * the UI renders the confidence beside every claim.
 */
export const ROOT_CAUSES: RootCause[] = [
  {
    id: "rc-payment-latency",
    title: "Payment Service connection pool reduced by a canary deployment",
    statement:
      "Deployment pay-2026.08.26.4 lowered the per-pod database connection ceiling from 240 to 60. At current volume the payment tier cannot acquire connections fast enough, so authorisation requests queue until they hit the 8-second timeout.",
    entityId: "svc-payment-service",
    entityLabel: "Payment Service",
    layer: "change",
    confidence: confidence(
      0.91,
      "The changed file is the pool configuration itself, the ordering is unambiguous, and no other change touched the payment path in the preceding six hours. Residual uncertainty is whether the pooler migration would have absorbed the reduction had it shipped together.",
    ),
    provenance: "derived",
    evidenceIds: ["ev-005", "ev-004", "ev-003", "ev-006", "ev-002", "ev-013"],
    contributingFactors: [
      {
        id: "cf-pool-saturation",
        title: "Payments database connection pool saturated at 97%",
        statement:
          "The primary database has been at 97% pool utilisation since 14:29:40 UTC, so every additional request waits.",
        entityId: "db-payments-primary",
        evidenceIds: ["ev-003", "ev-006"],
        confidence: confidence(0.96, "Directly measured by CloudWatch at one-minute resolution."),
      },
      {
        id: "cf-risk-engine-share",
        title: "Risk Engine shares the same pool",
        statement:
          "Risk Engine competes for the same connections, amplifying queueing and adding 2.1s to the authorisation path.",
        entityId: "svc-risk-engine",
        evidenceIds: ["ev-016"],
        confidence: confidence(0.84, "Shared-pool topology is observed; the amplification share is modelled."),
      },
      {
        id: "cf-timeout-window",
        title: "Authorisation timeout raised to 9s earlier the same day",
        statement:
          "CHG-8839 lengthened the timeout, which is why customers wait 8.2 seconds before seeing a failure rather than failing fast.",
        entityId: "app-checkout",
        evidenceIds: ["ev-014"],
        confidence: confidence(0.79, "Not causal to the degradation, but it materially shapes the customer experience."),
      },
      {
        id: "cf-no-failover",
        title: "No alternative authorisation path exists",
        statement:
          "Every checkout completion depends on Payment Service reaching the primary database; the graph finds no observed failover route.",
        entityId: "jny-checkout",
        evidenceIds: ["ev-054"],
        confidence: confidence(0.89, "Derived from 90 days of traces with no observed alternative path."),
      },
    ],
    pathId: "path-checkout-causal",
    firstObservedAt: T.deploy,
  },
  {
    id: "rc-eu-network-latency",
    title: "Routing policy change moved EU search traffic onto a degraded path",
    statement:
      "CHG-8836 lowered BGP local-preference for the search prefix, shifting traffic onto an intra-region path through core-rtr-euc1-01 Ethernet3/1, which is showing 0.68% loss and 38.6 ms round-trip against a 1.4 ms baseline.",
    entityId: "rtr-core-euc1",
    entityLabel: "core-rtr-euc1-01",
    layer: "network",
    confidence: confidence(
      0.87,
      "Path change is directly visible in traceroute; loss begins three minutes after the policy took effect. The interface may also have an underlying hardware fault, which would make the policy an exposure rather than the sole cause.",
    ),
    provenance: "derived",
    evidenceIds: ["ev-024", "ev-022", "ev-023", "ev-021"],
    contributingFactors: [
      {
        id: "cf-single-az-index",
        title: "Search index tier is single-AZ in eu-central",
        statement: "All eight index nodes sit in euc1-az1b, so there is no healthy path to fail over to.",
        entityId: "vm-search-index-euc1-a",
        evidenceIds: ["ev-041"],
        confidence: confidence(0.95, "Placement is read directly from the cloud inventory."),
      },
      {
        id: "cf-recurring-loss",
        title: "Third loss event on this router in 30 days",
        statement: "core-rtr-euc1-01 has shown loss above 0.5% on 17, 21 and 26 August, each after a routing change.",
        entityId: "rtr-core-euc1",
        evidenceIds: ["ev-053"],
        confidence: confidence(0.81, "All three events are observed; the common-cause grouping is inferred."),
      },
    ],
    pathId: "path-search-causal",
    firstObservedAt: T.euNetworkChange,
  },
  {
    id: "rc-token-refresh",
    title: "Stored-credential token lifetime shortened below the renewal batch duration",
    statement:
      "CHG-8829 reduced stored-credential token TTL from 24 hours to 1 hour for compliance. The renewal batch runs up to four hours, so tokens expire mid-run and refresh attempts collide with the same batch's own load.",
    entityId: "svc-identity-token",
    entityLabel: "Token Service",
    layer: "security",
    confidence: confidence(
      0.89,
      "The failure mode is exactly token expiry mid-batch, and no other identity change landed in the window.",
    ),
    provenance: "derived",
    evidenceIds: ["ev-030", "ev-029", "ev-031"],
    contributingFactors: [
      {
        id: "cf-retry-window",
        title: "Retry window was not adjusted with the TTL",
        statement: "The billing retry schedule still assumes a 24-hour credential lifetime.",
        entityId: "svc-subscription-billing",
        evidenceIds: ["ev-032"],
        confidence: confidence(0.86, "Confirmed against the deployed retry configuration."),
      },
    ],
    firstObservedAt: T.subscriptionChange,
  },
  {
    id: "rc-mobile-crash",
    title: "Basket surface rewrite crashes on Android 14",
    statement:
      "Mobile 8.42.1 introduced a view-recycling regression that crashes on Android 14 devices entering the basket from a deep link.",
    entityId: "app-mobile",
    entityLabel: "Nike Mobile App",
    layer: "application",
    confidence: confidence(0.83, "Crash signature is exclusive to the new build and stopped when the rollout was halted."),
    provenance: "derived",
    evidenceIds: ["ev-042"],
    contributingFactors: [],
    firstObservedAt: T.mobileCrashStart,
  },
  {
    id: "rc-cdn-cache-key",
    title: "Cache-key change invalidated the edge tier",
    statement:
      "A cache-key normalisation invalidated the entire edge cache at once, so hit rate collapsed to 41% and origin load rose 6.2× until the cache refilled.",
    entityId: "svc-cdn-edge",
    entityLabel: "Edge Delivery",
    layer: "platform",
    confidence: confidence(0.94, "Hit rate collapse begins at the exact deployment timestamp and recovers on the refill curve."),
    provenance: "derived",
    evidenceIds: ["ev-043"],
    contributingFactors: [],
    firstObservedAt: T.cdnStormStart,
  },
  {
    id: "rc-identity-latency",
    title: "Token issuance contention during a session store failover",
    statement:
      "A managed failover of the session store added 900 ms to token issuance for 85 minutes.",
    entityId: "svc-identity-token",
    entityLabel: "Token Service",
    layer: "platform",
    confidence: confidence(0.88, "Failover event and latency window align to the second."),
    provenance: "derived",
    evidenceIds: ["ev-057"],
    contributingFactors: [],
    firstObservedAt: T.identityLatencyStart,
  },
  {
    id: "rc-queue-backlog",
    title: "Order events consumer lag from insufficient partitions",
    statement:
      "A promotional spike exceeded the partition count on the order-events topic, producing 41-second consumer lag and delayed fulfilment handoff.",
    entityId: "q-order-events",
    entityLabel: "Order Events Stream",
    layer: "platform",
    confidence: confidence(0.9, "Lag tracks partition saturation precisely and resolved on the partition increase."),
    provenance: "derived",
    evidenceIds: ["ev-058"],
    contributingFactors: [],
    firstObservedAt: T.queueBacklogStart,
  },
  {
    id: "rc-firewall-egress",
    title: "Egress policy omitted the carrier callback range",
    statement:
      "Replacing a broad egress allow with an explicit destination list dropped every Meridian carrier callback for 2h15m.",
    entityId: "fw-edge-euc1",
    entityLabel: "fw-edge-euc1",
    layer: "security",
    confidence: confidence(0.96, "Firewall deny counters name the exact rule and source range."),
    provenance: "derived",
    evidenceIds: ["ev-044"],
    contributingFactors: [],
    firstObservedAt: T.firewallBlockStart,
  },
  {
    id: "rc-router-firmware",
    title: "Router firmware regression caused buffer drops",
    statement:
      "Firmware 9.4.2 introduced a buffer allocation regression producing 0.9% loss on the eu-central core path.",
    entityId: "rtr-core-euc1",
    entityLabel: "core-rtr-euc1-01",
    layer: "network",
    confidence: confidence(0.84, "Loss began after activation and stopped on downgrade."),
    provenance: "derived",
    evidenceIds: ["ev-053"],
    contributingFactors: [],
    firstObservedAt: T.frankfurtLossStart,
  },
  {
    id: "rc-pricing-leak",
    title: "Unbounded offer cache leaked heap",
    statement:
      "A personalised-offer cache added in pri-2026.08.14.2 had no eviction policy and leaked roughly 180 MB per hour.",
    entityId: "svc-pricing-engine",
    entityLabel: "Pricing Engine",
    layer: "application",
    confidence: confidence(0.92, "Heap growth begins at the release and stops on rollback."),
    provenance: "derived",
    evidenceIds: ["ev-059"],
    contributingFactors: [],
    firstObservedAt: T.pricingLeakStart,
  },
];

export const ROOT_CAUSES_BY_ID = new Map(ROOT_CAUSES.map((r) => [r.id, r]));

/**
 * Recommendations are AI interpretation by construction. They carry the
 * `interpreted` provenance so the UI can mark them distinctly from measured
 * facts and derived calculations.
 */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-rollback-payments",
    title: "Roll back pay-2026.08.26.4 on the canary pods",
    rationale:
      "The canary is holding a connection ceiling the payment tier cannot work within. Reverting restores maxPoolSize to 240 on all pods; the previous release ran 41 days at 52% pool utilisation under comparable load.",
    effort: "immediate",
    expectedEffect:
      "Modelled recovery of checkout success rate to above 98% within 8–12 minutes of the revert completing, before the 16:00 UTC peak.",
    owningTeam: "Payments Engineering",
    provenance: "interpreted",
    confidence: confidence(0.86, "Prior configuration is known-good; residual risk is whatever else the release changed."),
    evidenceIds: ["ev-050", "ev-005", "ev-015", "ev-055"],
    relatedIncidentId: "inc-4417",
    priority: 1,
  },
  {
    id: "rec-shed-risk-engine",
    title: "Move Risk Engine to a separate connection pool",
    rationale:
      "Risk Engine and Payment Service compete for the same database connections, so any pool pressure is amplified across two services at once.",
    effort: "short-term",
    expectedEffect:
      "Removes a contributing factor that added roughly 2.1 s to the authorisation path during this incident.",
    owningTeam: "Payments Engineering",
    provenance: "interpreted",
    confidence: confidence(0.74, "Isolation is sound in principle; the exact latency recovered is modelled."),
    evidenceIds: ["ev-016", "ev-003"],
    relatedIncidentId: "inc-4417",
    priority: 2,
  },
  {
    id: "rec-revert-bgp",
    title: "Revert the eu-central local-preference change",
    rationale:
      "Search traffic is on a path with 0.68% loss and 38.6 ms round-trip. The prior preference used a path measured at 1.4 ms.",
    effort: "immediate",
    expectedEffect: "Modelled return of EU search p95 to below 600 ms within one BGP convergence cycle.",
    owningTeam: "Network Engineering",
    provenance: "interpreted",
    confidence: confidence(0.82, "The previous path is currently healthy; convergence behaviour is predictable but not guaranteed."),
    evidenceIds: ["ev-024", "ev-022"],
    relatedIncidentId: "inc-4416",
    priority: 1,
  },
  {
    id: "rec-spread-search-index",
    title: "Spread the eu-central search index across availability zones",
    rationale:
      "All eight index nodes are in euc1-az1b. Any AZ-level network event takes the whole tier with it, which is exactly what happened today.",
    effort: "structural",
    expectedEffect: "Removes a single point of failure affecting 41,200 customers in the current incident.",
    owningTeam: "Search & Discovery",
    provenance: "interpreted",
    confidence: confidence(0.91, "Placement is directly observed; the benefit follows from standard AZ isolation."),
    evidenceIds: ["ev-041", "ev-027"],
    relatedIncidentId: "inc-4416",
    priority: 2,
  },
  {
    id: "rec-align-retry-ttl",
    title: "Align the renewal retry window with the new token TTL",
    rationale:
      "The billing batch still assumes a 24-hour credential lifetime while tokens now expire after one hour.",
    effort: "short-term",
    expectedEffect: "Modelled reduction of renewal failures from 11.4% back toward the 0.6% baseline.",
    owningTeam: "Subscriptions",
    provenance: "interpreted",
    confidence: confidence(0.83, "The mismatch is confirmed; the recovered rate assumes no other renewal failure mode."),
    evidenceIds: ["ev-030", "ev-029", "ev-032"],
    relatedIncidentId: "inc-4414",
    priority: 2,
  },
  {
    id: "rec-pool-guardrail",
    title: "Add a pre-deployment guardrail on connection-pool configuration",
    rationale:
      "Three of the last eleven payment incidents involved pool exhaustion following a configuration change. A capacity check against live connection demand would have blocked this release.",
    effort: "structural",
    expectedEffect:
      "Addresses a recurring failure signature rather than a single incident; modelled to prevent roughly one Sev 1 per quarter.",
    owningTeam: "Platform Reliability",
    provenance: "interpreted",
    confidence: confidence(0.68, "Signature matching is lexical plus entity overlap, so the recurrence count is approximate."),
    evidenceIds: ["ev-038", "ev-045"],
    priority: 2,
  },
  {
    id: "rec-orders-pool-headroom",
    title: "Raise orders database connection headroom before the autumn peak",
    rationale:
      "Orders pool utilisation has climbed from 48% to 68% over 30 days at constant volume, projecting to the 85% alert threshold in roughly nine days.",
    effort: "short-term",
    expectedEffect: "Prevents a repeat of today's failure mode on a second mission-critical journey.",
    owningTeam: "Data Platform",
    provenance: "interpreted",
    confidence: confidence(0.58, "A linear extrapolation over 30 days; seasonal load could bring the date forward or push it back."),
    evidenceIds: ["ev-039", "ev-040"],
    priority: 3,
  },
  {
    id: "rec-checkout-failfast",
    title: "Fail fast on authorisation and offer a retry",
    rationale:
      "Customers currently wait 8.2 seconds before seeing an error. A 3-second budget with an explicit retry converts a dead end into a recoverable moment.",
    effort: "short-term",
    expectedEffect:
      "Modelled recovery of 18–24% of abandoned baskets during payment degradation, based on prior incidents with fail-fast behaviour.",
    owningTeam: "Commerce Platform",
    provenance: "interpreted",
    confidence: confidence(0.62, "The recovery range comes from two prior incidents, which is a thin base for a point estimate."),
    evidenceIds: ["ev-014", "ev-019"],
    relatedIncidentId: "inc-4417",
    priority: 3,
  },
];

export const RECOMMENDATIONS_BY_ID = new Map(RECOMMENDATIONS.map((r) => [r.id, r]));

export const EMERGING_RISKS: EmergingRisk[] = [
  {
    id: "risk-orders-pool",
    title: "Orders database will reach its connection threshold in about nine days",
    statement:
      "Connection pool utilisation on nike-orders-primary has trended from 48% to 68% over 30 days at flat transaction volume. At the current slope it crosses the 85% alert threshold within nine days — and the autumn peak lands inside that window.",
    entityId: "db-orders-primary",
    entityLabel: "Orders Primary Database",
    likelihood: 0.64,
    horizon: "9 days",
    potentialImpact: usd(2_840_000),
    journeysAtRisk: ["jny-order-place", "jny-checkout", "jny-returns"],
    leadingIndicators: [
      { label: "Pool utilisation", value: "68% (was 48%)", evidenceId: "ev-039" },
      { label: "Days to threshold", value: "9", evidenceId: "ev-040" },
    ],
    confidence: confidence(0.58, "Linear extrapolation over 30 days; seasonality could move the date in either direction."),
    recommendationId: "rec-orders-pool-headroom",
    severityIfRealised: "high",
  },
  {
    id: "risk-search-single-az",
    title: "EU search has no availability-zone redundancy",
    statement:
      "All eight eu-central search index nodes sit in euc1-az1b. Today's incident is the second AZ-scoped event in 30 days to take the entire tier with it.",
    entityId: "vm-search-index-euc1-a",
    entityLabel: "Search index tier · eu-central",
    likelihood: 0.41,
    horizon: "30 days",
    potentialImpact: usd(1_640_000),
    journeysAtRisk: ["jny-search", "jny-browse"],
    leadingIndicators: [
      { label: "Nodes outside az1b", value: "0 of 8", evidenceId: "ev-041" },
      { label: "AZ-scoped events in 30 days", value: "3", evidenceId: "ev-053" },
    ],
    confidence: confidence(0.72, "Placement is certain; the recurrence rate is estimated from a 30-day sample."),
    recommendationId: "rec-spread-search-index",
    severityIfRealised: "medium",
  },
  {
    id: "risk-checkout-no-failover",
    title: "Checkout has a single authorisation path with no failover",
    statement:
      "Every checkout completion depends on Payment Service reaching the primary database. Over 90 days of traces the graph has never observed an alternative route, so any payment-tier fault is a full checkout outage.",
    entityId: "jny-checkout",
    entityLabel: "Complete Checkout",
    likelihood: 0.38,
    horizon: "quarter",
    potentialImpact: usd(11_400_000),
    journeysAtRisk: ["jny-checkout", "jny-payment", "jny-gift-card"],
    leadingIndicators: [
      { label: "Observed alternative paths", value: "0", evidenceId: "ev-054" },
      { label: "Payment incidents this quarter", value: "3", evidenceId: "ev-038" },
    ],
    confidence: confidence(0.66, "The absence of an observed path is strong but does not prove no failover exists."),
    severityIfRealised: "high",
  },
  {
    id: "risk-change-failure-rate",
    title: "Change failure rate has risen to 18.4%",
    statement:
      "39 of 212 production changes in the last 30 days were followed by a correlated degradation within two hours, up from 11.2% the prior month. Payments and Search account for 61% of them.",
    entityId: "app-payments",
    entityLabel: "Change quality",
    likelihood: 0.71,
    horizon: "30 days",
    potentialImpact: usd(4_200_000),
    journeysAtRisk: ["jny-checkout", "jny-payment", "jny-search"],
    leadingIndicators: [
      { label: "Change failure rate", value: "18.4% (was 11.2%)", evidenceId: "ev-045" },
      { label: "High-risk changes without a staged rollout", value: "7 of 22", evidenceId: "ev-045" },
    ],
    confidence: confidence(0.72, "Two-hour topological correlation will include some coincidental pairings."),
    recommendationId: "rec-pool-guardrail",
    severityIfRealised: "high",
  },
  {
    id: "risk-frankfurt-router",
    title: "core-rtr-euc1-01 has failed three times in 30 days",
    statement:
      "The eu-central core router has shown packet loss above 0.5% on three separate occasions this month, each following a change. The pattern suggests an underlying hardware or firmware fault rather than three unrelated policy errors.",
    entityId: "rtr-core-euc1",
    entityLabel: "core-rtr-euc1-01",
    likelihood: 0.55,
    horizon: "14 days",
    potentialImpact: usd(980_000),
    journeysAtRisk: ["jny-search", "jny-browse", "jny-delivery-track"],
    leadingIndicators: [
      { label: "Loss events in 30 days", value: "3", evidenceId: "ev-053" },
      { label: "Current interface loss", value: "0.68%", evidenceId: "ev-023" },
    ],
    confidence: confidence(0.63, "The events are observed; attributing them to a common hardware cause is a hypothesis."),
    severityIfRealised: "medium",
  },
];
