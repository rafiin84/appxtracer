import type { ExecutiveInsightsPayload, TimeRangeKey } from "@/types";
import { buildSeries } from "./telemetry";
import { T } from "./narrative";
import { usd } from "./primitives";

/**
 * Executive insights operate on a 90-day horizon regardless of the selected
 * window — a CIO reading trends is not asking about the last six hours.
 */
const HORIZON: TimeRangeKey = "90d";

export function buildExecutiveInsights(): ExecutiveInsightsPayload {
  const experience = buildSeries(
    {
      id: "exec:experience",
      label: "Experience score",
      unit: "score",
      base: 88.4,
      noise: 0.014,
      drift: -0.07,
      min: 0,
      max: 100,
      decimals: 1,
      baseline: 90,
      events: [
        { from: T.pricingLeakStart, to: T.pricingLeakEnd, delta: -4.2, rampMinutes: 60, decayMinutes: 180 },
        { from: T.cdnStormStart, to: T.cdnStormEnd, delta: -6.1, rampMinutes: 20, decayMinutes: 60 },
        { from: T.journeyDegraded, rampMinutes: 10, delta: -22.4 },
      ],
    },
    HORIZON,
  );

  const valueAtRisk = buildSeries(
    {
      id: "exec:value-at-risk",
      label: "Value at risk",
      unit: "currency",
      base: 620_000,
      noise: 0.32,
      drift: 0.44,
      min: 0,
      events: [
        { from: T.frankfurtLossStart, to: T.frankfurtLossEnd, delta: 184_000, rampMinutes: 30, decayMinutes: 60 },
        { from: T.cdnStormStart, to: T.cdnStormEnd, delta: 240_000, rampMinutes: 20, decayMinutes: 40 },
        { from: T.journeyDegraded, rampMinutes: 10, delta: 5_600_000 },
      ],
    },
    HORIZON,
  );

  const incidentCount = buildSeries(
    {
      id: "exec:incidents",
      label: "Incidents per week",
      unit: "count",
      base: 6.4,
      noise: 0.22,
      drift: 0.38,
      min: 0,
      decimals: 1,
    },
    HORIZON,
  );

  const changeFailureRate = buildSeries(
    {
      id: "exec:change-failure-rate",
      label: "Change failure rate",
      unit: "pct",
      base: 12.4,
      noise: 0.14,
      drift: 0.46,
      min: 0,
      max: 100,
      decimals: 1,
      baseline: 12,
    },
    HORIZON,
  );

  return {
    period: "Last 90 days · quarter to date",
    trends: { experience, valueAtRisk, incidentCount, changeFailureRate },
    insights: [
      {
        id: "ins-experience-decline",
        title: "Digital experience has declined for three consecutive months",
        narrative:
          "The composite experience score has fallen from 87.2 to 80.8 over 30 days and from 91.4 across the quarter. The decline is concentrated in speed and reliability rather than availability — the estate is up, but it is slower and failing more often. Two thirds of the drop is attributable to the payment and search paths.",
        category: "experience-trend",
        direction: "worsening",
        metric: { label: "Experience score", value: "80.8", deltaPct: -7.3 },
        series: experience,
        evidenceIds: ["ev-047", "ev-001", "ev-021"],
      },
      {
        id: "ins-change-quality",
        title: "Change failure rate has risen to 18.4%",
        narrative:
          "39 of 212 production changes in the last 30 days were followed by a correlated degradation within two hours, against 11.2% the prior month. Payments and Search account for 61% of them. Seven of 22 high-risk changes shipped without a staged rollout, including today's Sev 1.",
        category: "change-quality",
        direction: "worsening",
        metric: { label: "Change failure rate", value: "18.4%", deltaPct: 64.3 },
        series: changeFailureRate,
        evidenceIds: ["ev-045", "ev-004"],
        recommendationId: "rec-pool-guardrail",
      },
      {
        id: "ins-payments-concentration",
        title: "Payments accounts for 41% of quarterly value at risk",
        narrative:
          "No other application comes close: Search is second at 14%. Three of the last eleven payment incidents share the same signature — connection-pool exhaustion following a configuration change — which makes this a structural problem rather than a run of bad luck.",
        category: "problem-application",
        direction: "worsening",
        metric: { label: "Share of value at risk", value: "41%" },
        evidenceIds: ["ev-046", "ev-038"],
        recommendationId: "rec-pool-guardrail",
      },
      {
        id: "ins-checkout-budget",
        title: "Complete Checkout has exhausted its monthly error budget",
        narrative:
          "The budget reached 0% at 15:02 UTC today, five days before the period closes. Checkout has breached in two of the last three months. Under the current SLO policy this freezes non-essential change on the checkout path until the period resets.",
        category: "problem-journey",
        direction: "worsening",
        metric: { label: "Error budget remaining", value: "0%", deltaPct: -100 },
        evidenceIds: ["ev-037", "ev-001"],
      },
      {
        id: "ins-frankfurt-recurring",
        title: "The Frankfurt core router has failed three times this month",
        narrative:
          "Packet loss above 0.5% on 17, 21 and 26 August, each following a change. Individually each was closed as a change error; together they suggest an underlying hardware or firmware fault that three separate post-incident reviews did not connect.",
        category: "recurring-incident",
        direction: "worsening",
        metric: { label: "Recurrences", value: "3 in 30 days" },
        evidenceIds: ["ev-053", "ev-023"],
      },
      {
        id: "ins-value-at-risk-trend",
        title: "Monthly value at risk has grown 44% across the quarter",
        narrative:
          "Modelled transaction value at risk has risen from $4.1M to $5.9M per month. Incident count is up only 12%, so the increase is severity rather than frequency: incidents are landing on more business-critical paths than they were in June.",
        category: "revenue-trend",
        direction: "worsening",
        metric: { label: "Monthly value at risk", value: "$5.9M", deltaPct: 44 },
        series: valueAtRisk,
        evidenceIds: ["ev-046", "ev-010"],
      },
      {
        id: "ins-regional-eu",
        title: "European experience is now consistently below other regions",
        narrative:
          "EU West and EU Central have scored below the global average in 24 of the last 30 days. Two structural exposures explain most of it: the single-AZ search index and a core router with a recurring fault. Neither is a capacity problem.",
        category: "regional",
        direction: "worsening",
        metric: { label: "EU experience score", value: "56 vs 68 global", deltaPct: -17.6 },
        evidenceIds: ["ev-041", "ev-053", "ev-021"],
        recommendationId: "rec-spread-search-index",
      },
      {
        id: "ins-detection-improving",
        title: "Time to identify a cause has improved to 50 seconds",
        narrative:
          "Across the quarter, the median gap between alert and identified cause fell from 14 minutes to 50 seconds as more of the estate became connected in the graph. Today's Sev 1 was attributed to a specific configuration line 50 seconds after the first alert fired.",
        category: "reliability",
        direction: "improving",
        metric: { label: "Median time to identify", value: "50 s", deltaPct: -94 },
        evidenceIds: ["ev-013"],
      },
      {
        id: "ins-single-points",
        title: "Two mission-critical journeys have no failover path",
        narrative:
          "Complete Checkout and Make a Payment both depend on a single authorisation route to one database. Over 90 days of traces the graph has never observed an alternative. Today's incident is the third time this quarter that a payment-tier fault became a full checkout outage.",
        category: "risk",
        direction: "stable",
        metric: { label: "Journeys without failover", value: "2 of 10" },
        evidenceIds: ["ev-054", "ev-034"],
      },
    ],
    topProblemApplications: [
      { applicationId: "app-payments", name: "Payments Platform", incidents: 4, valueAtRisk: usd(7_240_000) },
      { applicationId: "app-search", name: "Search & Discovery", incidents: 3, valueAtRisk: usd(2_480_000) },
      { applicationId: "app-orders", name: "Order Management", incidents: 2, valueAtRisk: usd(1_506_000) },
      { applicationId: "app-mobile", name: "Nike Mobile App", incidents: 3, valueAtRisk: usd(918_000) },
      { applicationId: "app-identity", name: "Identity & Access", incidents: 2, valueAtRisk: usd(332_000) },
    ],
    topProblemJourneys: [
      { journeyId: "jny-checkout", name: "Complete Checkout", breaches: 5, valueAtRisk: usd(6_940_000) },
      { journeyId: "jny-payment", name: "Make a Payment", breaches: 4, valueAtRisk: usd(6_180_000) },
      { journeyId: "jny-search", name: "Search & Discover", breaches: 3, valueAtRisk: usd(1_820_000) },
      { journeyId: "jny-subscription-renew", name: "Renew Nike Membership", breaches: 2, valueAtRisk: usd(682_000) },
      { journeyId: "jny-order-place", name: "Place Order", breaches: 2, valueAtRisk: usd(1_506_000) },
    ],
    recurringIncidents: [
      {
        signature: "Connection pool exhaustion following a configuration change",
        occurrences: 3,
        lastAt: T.paymentLatency,
        incidentIds: ["inc-4417"],
      },
      {
        signature: "Packet loss on core-rtr-euc1-01 after a network change",
        occurrences: 3,
        lastAt: T.euLatencyStart,
        incidentIds: ["inc-4416", "inc-4387"],
      },
      {
        signature: "Security policy change blocking a legitimate integration",
        occurrences: 2,
        lastAt: T.subscriptionChange,
        incidentIds: ["inc-4414", "inc-4392"],
      },
    ],
    availability: {
      state: "partial",
      missing: ["margin data"],
      note: "Value at risk is transaction value, not margin. Margin data is not connected to APPX Tracer in this environment.",
    },
  };
}
