import type {
  Confidence,
  ISODateTime,
  Provenance,
  Severity,
} from "./core";

export type EvidenceKind =
  | "metric"
  | "log"
  | "trace"
  | "event"
  | "change-record"
  | "transaction"
  | "revenue-record"
  | "config-snapshot"
  | "graph-assertion"
  | "correlation";

export type SourceSystem =
  | "Datadog"
  | "Dynatrace"
  | "Splunk"
  | "OpenTelemetry"
  | "AWS CloudWatch"
  | "Azure Monitor"
  | "Google Cloud Operations"
  | "ManageEngine OpManager"
  | "ManageEngine AppManager"
  | "ThousandEyes"
  | "Palo Alto Panorama"
  | "GitHub Actions"
  | "ServiceNow"
  | "Stripe Ledger"
  | "Nike Order Service"
  | "APPX Graph";

export interface EvidenceSource {
  id: string;
  system: SourceSystem;
  category:
    | "apm"
    | "logs"
    | "tracing"
    | "infrastructure"
    | "network"
    | "security"
    | "change"
    | "business"
    | "graph";
  /** Deep-link back into the system of record. Never navigated in Phase 1. */
  reference: string;
  ingestedAt: ISODateTime;
  /** Freshness of the feed at query time. */
  latencySeconds: number;
  trust: "authoritative" | "corroborating" | "advisory";
}

/**
 * An evidence record is the atom of trust in APPX Tracer. Every headline number,
 * causal claim and recommendation resolves to a set of these.
 */
export interface Evidence {
  id: string;
  /** Stable short handle rendered inline in prose, e.g. "E3". */
  handle: string;
  title: string;
  statement: string;
  kind: EvidenceKind;
  provenance: Provenance;
  confidence?: Confidence;
  observedAt: ISODateTime;
  /** Window the evidence covers, when it is an aggregate. */
  window?: { from: ISODateTime; to: ISODateTime };
  source: EvidenceSource;
  /** Entities the evidence is about. */
  subjectIds: string[];
  /** Graph triple this evidence supports, when applicable. */
  assertion?: { subject: string; predicate: string; object: string };
  /** Numeric payload, when the evidence is a measurement. */
  measurement?: {
    label: string;
    value: number;
    unit: string;
    baseline?: number;
    deltaPct?: number;
  };
  /** Raw excerpt — a log line, a trace span, a change diff. */
  excerpt?: string;
  relatedEvidenceIds: string[];
  severity?: Severity;
}

export interface Citation {
  evidenceId: string;
  handle: string;
  /** Which sentence of the answer this citation supports. */
  claim: string;
}

export interface Inference {
  id: string;
  statement: string;
  /** Ontology rule that licensed the inference. */
  rule: string;
  confidence: Confidence;
  premiseEvidenceIds: string[];
  provenance: Extract<Provenance, "derived">;
}

export interface RootCause {
  id: string;
  title: string;
  statement: string;
  entityId: string;
  entityLabel: string;
  /** The layer the cause sits in, for the "why" narrative. */
  layer: "application" | "platform" | "infrastructure" | "network" | "security" | "change" | "third-party";
  confidence: Confidence;
  provenance: Provenance;
  evidenceIds: string[];
  contributingFactors: ContributingFactor[];
  pathId?: string;
  firstObservedAt: ISODateTime;
}

export interface ContributingFactor {
  id: string;
  title: string;
  statement: string;
  entityId?: string;
  evidenceIds: string[];
  confidence: Confidence;
}

export type RecommendationEffort = "immediate" | "short-term" | "structural";

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  effort: RecommendationEffort;
  /** Expected business effect if actioned, always modelled and labelled so. */
  expectedEffect: string;
  owningTeam: string;
  provenance: Extract<Provenance, "interpreted">;
  confidence: Confidence;
  evidenceIds: string[];
  relatedIncidentId?: string;
  priority: 1 | 2 | 3;
}

export interface InvestigationStep {
  id: string;
  order: number;
  action: string;
  /** Conceptual graph query the step ran. */
  query?: string;
  finding: string;
  evidenceIds: string[];
  durationMs: number;
}

export interface InvestigationTrace {
  id: string;
  question: string;
  startedAt: ISODateTime;
  steps: InvestigationStep[];
  entitiesTouched: number;
  factsConsidered: number;
}
