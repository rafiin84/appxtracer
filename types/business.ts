import type {
  Confidence,
  Criticality,
  CurrencyCode,
  HealthState,
  ISODateTime,
  Money,
  Owner,
  Region,
  RegionCode,
  TimeSeries,
  Trend,
} from "./core";

export interface Organization {
  id: string;
  name: string;
  segment: "enterprise" | "mid-market" | "consumer";
  region: RegionCode;
  /** Accounts under this organization; used for segment-level impact. */
  accountCount: number;
  contractValue: Money;
}

/**
 * A customer as the platform models them. Identifiers are pseudonymous by
 * default — `email` is only resolved through an explicit, audited lookup.
 */
export interface Customer {
  id: string;
  /** Display handle, safe to render anywhere. */
  displayName: string;
  /** Masked at the API boundary unless the caller holds `customer.pii.read`. */
  email: string;
  emailMasked: string;
  organizationId?: string;
  segment: "consumer" | "business" | "enterprise";
  tier: "standard" | "plus" | "premier";
  region: RegionCode;
  city: string;
  joinedAt: ISODateTime;
  lifetimeValue: Money;
  experienceScore: number;
  currentHealth: HealthState;
}

export type TransactionStatus =
  | "completed"
  | "failed"
  | "abandoned"
  | "pending"
  | "reversed";

export interface Transaction {
  id: string;
  customerId: string;
  journeyId: string;
  status: TransactionStatus;
  value: Money;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
  durationMs: number;
  /** Where in the journey it stopped, when it did not complete. */
  failedAtStepId?: string;
  failureReason?: string;
  traceId?: string;
  region: RegionCode;
}

export interface RevenueEvent {
  id: string;
  transactionId: string;
  journeyId: string;
  recognisedAt: ISODateTime;
  amount: Money;
  region: RegionCode;
}

export interface BusinessService {
  id: string;
  name: string;
  description: string;
  criticality: Criticality;
  owner: Owner;
  journeyIds: string[];
  applicationIds: string[];
  health: HealthState;
  /** Revenue attributable to this service over the active window. */
  revenueWindow: Money;
}

/** A step in a business journey — an actual funnel stage, not a technical span. */
export interface JourneyStep {
  id: string;
  name: string;
  order: number;
  /** Applications that serve this step. */
  applicationIds: string[];
  health: HealthState;
  p95LatencyMs: number;
  errorRatePct: number;
  /** Share of sessions that leave the journey at this step. */
  dropOffPct: number;
  successRatePct: number;
}

export type JourneyDiscoveryState =
  | "proposed" // auto-discovered, awaiting business validation
  | "validated" // a business owner confirmed the shape and value
  | "governed"; // validated, plus SLO/SLA and criticality assigned

export interface JourneySlo {
  /** Target success rate, percent. */
  successRatePct: number;
  /** Target p95 latency, ms. */
  p95LatencyMs: number;
  /** Remaining error budget for the current period, percent of budget. */
  errorBudgetRemainingPct: number;
  period: "monthly" | "quarterly";
}

export interface BusinessJourney {
  id: string;
  name: string;
  /** One line a CIO would recognise, e.g. "Customer completes a purchase". */
  businessDescription: string;
  criticality: Criticality;
  discovery: {
    state: JourneyDiscoveryState;
    discoveredAt: ISODateTime;
    method: "transaction-mining" | "trace-clustering" | "manual";
    validatedBy?: Owner;
    validatedAt?: ISODateTime;
    confidence: Confidence;
    /** Signals that caused the platform to propose this journey. */
    signals: string[];
  };
  owner?: Owner;
  slo?: JourneySlo;
  health: HealthState;
  healthScore: number;
  steps: JourneyStep[];
  applicationIds: string[];
  /** Customers who entered the journey in the active window. */
  customersInWindow: number;
  customersAffected: number;
  transactionsInWindow: number;
  transactionsFailed: number;
  successRatePct: number;
  successRateTrend: Trend;
  p95LatencyMs: number;
  latencyTrend: Trend;
  conversionRatePct: number;
  conversionImpactPct: number;
  /** Value that actually flowed through the journey in the window. */
  observedValue: Money;
  /** Value modelled as at risk because of current degradation. */
  valueAtRisk: Money;
  revenuePerTransaction: Money;
  currency: CurrencyCode;
  regionalHealth: Array<{ region: RegionCode; health: HealthState; successRatePct: number }>;
  series: {
    successRate: TimeSeries;
    latency: TimeSeries;
    revenue?: TimeSeries;
  };
  incidentIds: string[];
  changeIds: string[];
  rootCauseId?: string;
  degradedSince?: ISODateTime;
}

export interface GeographicImpact {
  region: Region;
  customersAffected: number;
  customersActive: number;
  health: HealthState;
  experienceScore: number;
  valueAtRisk: Money;
  topJourneyId?: string;
}
