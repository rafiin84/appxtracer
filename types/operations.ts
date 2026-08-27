import type {
  Confidence,
  HealthState,
  ISODateTime,
  Money,
  Owner,
  Provenance,
  RegionCode,
  Severity,
} from "./core";

export type IncidentState =
  | "investigating"
  | "identified"
  | "mitigating"
  | "monitoring"
  | "resolved";

export interface IncidentTimelineEntry {
  id: string;
  at: ISODateTime;
  kind:
    | "detected"
    | "impact"
    | "change"
    | "diagnosis"
    | "mitigation"
    | "escalation"
    | "resolution";
  title: string;
  detail: string;
  provenance: Provenance;
  evidenceIds: string[];
  actorTeam?: string;
}

export interface Incident {
  id: string;
  reference: string;
  title: string;
  /** The line a CIO reads: business consequence, not component names. */
  businessSummary: string;
  severity: Severity;
  state: IncidentState;
  startedAt: ISODateTime;
  detectedAt: ISODateTime;
  resolvedAt?: ISODateTime;
  owner: Owner;
  customersAffected: number;
  customersAffectedPct: number;
  journeyIds: string[];
  applicationIds: string[];
  serviceIds: string[];
  infrastructureIds: string[];
  regions: RegionCode[];
  transactionsFailed: number;
  valueAtRisk: Money;
  observedValueLost?: Money;
  rootCauseId?: string;
  contributingFactorIds: string[];
  changeIds: string[];
  evidenceIds: string[];
  timeline: IncidentTimelineEntry[];
  recommendationIds: string[];
  detectionSource: string;
}

export type AlertState = "firing" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  at: ISODateTime;
  title: string;
  source: string;
  state: AlertState;
  severity: Severity;
  entityId: string;
  incidentId?: string;
  /** Whether APPX correlated this alert into an incident narrative. */
  correlated: boolean;
}

export type ChangeKind =
  | "deployment"
  | "configuration"
  | "infrastructure"
  | "network"
  | "security"
  | "database"
  | "feature-flag";

export type ChangeRisk = "low" | "medium" | "high";

export interface Change {
  id: string;
  reference: string;
  title: string;
  kind: ChangeKind;
  at: ISODateTime;
  actorTeam: string;
  approvedBy?: Owner;
  risk: ChangeRisk;
  /** Entities the change touched. */
  targetIds: string[];
  applicationIds: string[];
  serviceIds: string[];
  infrastructureIds: string[];
  regions: RegionCode[];
  summary: string;
  detail: string;
  rolledBack: boolean;
  rolledBackAt?: ISODateTime;
  /** Correlation to observed degradation, when the graph found one. */
  correlation?: ChangeCorrelation;
  evidenceIds: string[];
  source: string;
}

export interface ChangeCorrelation {
  incidentId?: string;
  journeyIds: string[];
  /** Minutes between the change and the first observed degradation. */
  leadTimeMinutes: number;
  confidence: Confidence;
  /** What moved, in plain language. */
  observedEffect: string;
  provenance: Extract<Provenance, "derived">;
}

export interface Deployment extends Change {
  kind: "deployment";
  version: string;
  previousVersion: string;
  strategy: "rolling" | "blue-green" | "canary";
  rolloutPct: number;
}

export interface HealthSnapshot {
  entityId: string;
  at: ISODateTime;
  health: HealthState;
  score: number;
}
