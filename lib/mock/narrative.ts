import type { Money } from "@/types";

/**
 * The demo's spine.
 *
 * Every module reads its timestamps and headline figures from here, which is
 * what keeps the dataset internally consistent: the deployment is eleven minutes
 * before the traced customer's failure in the trace view, in the incident
 * timeline, in the change correlation panel and in the Ask APPX answer, because
 * all four read the same constant.
 */
export const T = {
  /** Scenario 1 — checkout degradation (active, Sev 1). */
  deploy: "2026-08-26T14:26:00.000Z",
  poolSaturation: "2026-08-26T14:29:40.000Z",
  paymentLatency: "2026-08-26T14:31:12.000Z",
  journeyDegraded: "2026-08-26T14:33:00.000Z",
  alertFired: "2026-08-26T14:34:20.000Z",
  incidentOpened: "2026-08-26T14:35:10.000Z",
  tracedFailure: "2026-08-26T14:37:21.000Z",
  rolloutPaused: "2026-08-26T14:52:00.000Z",
  now: "2026-08-26T15:12:00.000Z",

  /** Scenario 2 — EU search latency (active, Sev 2). */
  euNetworkChange: "2026-08-26T10:48:00.000Z",
  euLatencyStart: "2026-08-26T11:05:00.000Z",
  euIncidentOpened: "2026-08-26T11:14:00.000Z",

  /** Scenario 3 — subscription renewal failures (mitigating, Sev 3). */
  subscriptionChange: "2026-08-26T06:40:00.000Z",
  subscriptionStart: "2026-08-26T07:12:00.000Z",
  subscriptionMitigated: "2026-08-26T09:30:00.000Z",

  /** Recently closed, used by the executive and changes views. */
  mobileCrashStart: "2026-08-25T18:20:00.000Z",
  cdnStormStart: "2026-08-24T21:10:00.000Z",
  cdnStormEnd: "2026-08-24T22:35:00.000Z",
  identityLatencyStart: "2026-08-23T13:40:00.000Z",
  identityLatencyEnd: "2026-08-23T15:05:00.000Z",
  queueBacklogStart: "2026-08-21T09:15:00.000Z",
  queueBacklogEnd: "2026-08-21T11:40:00.000Z",
  firewallBlockStart: "2026-08-19T16:05:00.000Z",
  firewallBlockEnd: "2026-08-19T18:20:00.000Z",
  frankfurtLossStart: "2026-08-17T02:30:00.000Z",
  frankfurtLossEnd: "2026-08-17T05:15:00.000Z",
  pricingLeakStart: "2026-08-14T22:00:00.000Z",
  pricingLeakEnd: "2026-08-15T04:10:00.000Z",
} as const;

/** The deployment at the centre of the primary scenario. */
export const PRIMARY_DEPLOYMENT = {
  changeId: "chg-8841",
  reference: "CHG-8841",
  version: "pay-2026.08.26.4",
  previousVersion: "pay-2026.08.25.2",
} as const;

export const PRIMARY_INCIDENT_ID = "inc-4417";
export const PRIMARY_JOURNEY_ID = "jny-checkout";
export const PRIMARY_APPLICATION_ID = "app-payments";
export const PRIMARY_ROOT_CAUSE_ID = "rc-payment-latency";

/**
 * Deduplicated business impact for the active window.
 *
 * Not a sum of per-journey figures: 18,420 checkout-affected customers and
 * 16,940 payment-affected customers overlap heavily, because a failed payment
 * is usually also a failed checkout. The graph resolves both to the same
 * customer entities before counting.
 */
export const WINDOW_IMPACT = {
  customersAffected: 24_780,
  customersActive: 3_140_000,
  transactionsFailed: 26_410,
  transactionsAtRisk: 31_900,
  /** Average order value over the trailing 7 days, from the revenue ledger. */
  averageOrderValue: 214.6,
  valueAtRisk: { amount: 6_242_000, currency: "USD", provenance: "derived" } satisfies Money,
  observedValueLost: { amount: 1_284_500, currency: "USD", provenance: "observed" } satisfies Money,
} as const;

export const CHECKOUT_IMPACT = {
  customersAffected: 18_420,
  transactionsFailed: 21_860,
  valueAtRisk: { amount: 4_691_000, currency: "USD", provenance: "derived" } satisfies Money,
  observedValueLost: { amount: 912_300, currency: "USD", provenance: "observed" } satisfies Money,
} as const;
