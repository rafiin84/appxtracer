import type {
  Availability,
  Confidence,
  HealthState,
  ISODateTime,
  Money,
  RegionCode,
  TimeSeries,
  Trend,
} from "./core";
import type { GeographicImpact } from "./business";
import type { GraphPath } from "./graph";

/**
 * The canonical business-impact block. Observed and modelled quantities are
 * separate fields on purpose: nothing in the UI may present a model output as
 * an accounting fact.
 */
export interface BusinessImpact {
  customersAffected: number;
  customersAffectedPct: number;
  transactionsFailed: number;
  transactionsAtRisk: number;
  /** Value that has actually been transacted and lost/reversed. */
  observedValueLost?: Money;
  /** Value modelled as at risk. Always accompanied by `basis`. */
  estimatedValueAtRisk: Money;
  conversionImpactPct: number;
  window: { from: ISODateTime; to: ISODateTime };
  /** How the estimate was produced — surfaced by "Why this number?". */
  basis: ImpactCalculationBasis;
  availability: Availability;
}

export interface ImpactCalculationBasis {
  method: string;
  /** Human-readable formula, rendered verbatim in the evidence drawer. */
  formula: string;
  inputs: Array<{ label: string; value: string; provenance: "observed" | "derived" }>;
  assumptions: string[];
  confidence: Confidence;
  /** Evidence backing each observed input. */
  evidenceIds: string[];
}

export type ImpactStatus = "affected" | "at-risk" | "unaffected";

export interface ImpactedEntity {
  id: string;
  label: string;
  kind: string;
  layer: "business" | "experience" | "application" | "platform" | "infrastructure";
  status: ImpactStatus;
  health: HealthState;
  /** Hops from the origin entity in the dependency graph. */
  distance: number;
  customersAffected: number;
  valueAtRisk?: Money;
  href?: string;
  reason: string;
}

export interface BlastRadius {
  originId: string;
  originLabel: string;
  originKind: string;
  /** Scenario applied to the origin. */
  scenario: "current-degradation" | "total-failure" | "regional-failure";
  scenarioLabel: string;
  generatedAt: ISODateTime;
  entities: ImpactedEntity[];
  journeysAffected: string[];
  businessServicesAffected: string[];
  impact: BusinessImpact;
  paths: GraphPath[];
  confidence: Confidence;
}

export interface EmergingRisk {
  id: string;
  title: string;
  statement: string;
  entityId: string;
  entityLabel: string;
  /** 0–1 modelled likelihood over the stated horizon. */
  likelihood: number;
  horizon: string;
  potentialImpact: Money;
  journeysAtRisk: string[];
  leadingIndicators: Array<{ label: string; value: string; evidenceId: string }>;
  confidence: Confidence;
  recommendationId?: string;
  severityIfRealised: "high" | "medium" | "low";
}

export interface ImpactSummary {
  totalCustomersAffected: number;
  totalCustomersActive: number;
  affectedPct: number;
  affectedTrend: Trend;
  valueAtRisk: Money;
  observedValueLost?: Money;
  valueAtRiskTrend: Trend;
  transactionsFailed: number;
  regions: RegionCode[];
  series: {
    customersAffected: TimeSeries;
    valueAtRisk?: TimeSeries;
  };
  geography: GeographicImpact[];
  availability: Availability;
}
