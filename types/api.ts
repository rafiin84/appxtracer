import type {
  Availability,
  EnvironmentRef,
  HealthState,
  ISODateTime,
  Money,
  TimeRange,
  TimeSeries,
  Trend,
} from "./core";
import type {
  BusinessJourney,
  Customer,
  GeographicImpact,
  Transaction,
} from "./business";
import type { Application, Service } from "./application";
import type { ExperienceOverview, Interaction, Session } from "./experience";
import type { Change, Incident } from "./operations";
import type {
  Citation,
  Evidence,
  InvestigationTrace,
  Recommendation,
  RootCause,
} from "./evidence";
import type { GraphPath, GraphQueryResult } from "./graph";
import type { BlastRadius, BusinessImpact, EmergingRisk, ImpactSummary } from "./impact";

/** Every mock endpoint returns this envelope so partial data is representable. */
export interface ApiEnvelope<T> {
  data: T;
  meta: {
    generatedAt: ISODateTime;
    environment: EnvironmentRef;
    range: TimeRange;
    availability: Availability;
    /** Sources that contributed, for the provenance ribbon. */
    sources: string[];
  };
}

export interface ApiError {
  code: "not-found" | "unavailable" | "invalid-request" | "timeout";
  message: string;
  /** What the user can still see despite the failure. */
  degradedTo?: string;
}

/* ---------------------------------- Home --------------------------------- */

export interface DigitalBusinessHealth {
  state: HealthState;
  score: number;
  scoreTrend: Trend;
  headline: string;
  /** Sentence that names the single thing most worth acting on. */
  subline: string;
  activeIncidentCount: number;
  highestSeverity?: string;
  since?: ISODateTime;
}

export interface CommandCenterPayload {
  health: DigitalBusinessHealth;
  impact: ImpactSummary;
  breakingJourneys: BusinessJourney[];
  journeysHealthy: number;
  journeysTotal: number;
  applicationsHurtingBusiness: Application[];
  applicationsTotal: number;
  activeIncidents: Incident[];
  recentChanges: Change[];
  rootCauses: RootCause[];
  emergingRisks: EmergingRisk[];
  recommendations: Recommendation[];
  experience: {
    score: number;
    trend: Trend;
    series: TimeSeries;
  };
  revenue: {
    observedWindow?: Money;
    atRisk: Money;
    series?: TimeSeries;
    availability: Availability;
  };
  geography: GeographicImpact[];
}

/* ------------------------------- Collections ------------------------------ */

export interface JourneysPayload {
  journeys: BusinessJourney[];
  proposed: BusinessJourney[];
  portfolio: {
    total: number;
    governed: number;
    validated: number;
    proposed: number;
    breaching: number;
  };
}

export interface ApplicationsPayload {
  applications: Application[];
  services: Service[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    critical: number;
    totalValueAtRisk: Money;
  };
}

export interface IncidentsPayload {
  incidents: Incident[];
  summary: {
    active: number;
    resolvedInWindow: number;
    customersAffected: number;
    valueAtRisk: Money;
    meanTimeToIdentifyMinutes: number;
  };
}

export interface ChangesPayload {
  changes: Change[];
  summary: {
    total: number;
    correlated: number;
    rolledBack: number;
    highRisk: number;
  };
}

/* -------------------------------- Customers ------------------------------- */

export interface CustomerTracePayload {
  customer: Customer;
  currentSession?: Session;
  sessions: Session[];
  interactions: Interaction[];
  transactions: Transaction[];
  journeys: Array<{ journeyId: string; name: string; outcome: string; at: ISODateTime }>;
  failurePoint?: {
    interactionId: string;
    summary: string;
    journeyId: string;
    journeyStepId: string;
    applicationId: string;
    at: ISODateTime;
  };
  narrative: Array<{ text: string; evidenceIds: string[] }>;
  path?: GraphPath;
  impact: BusinessImpact;
  evidence: Evidence[];
}

export interface CustomerSearchResult {
  id: string;
  displayName: string;
  emailMasked: string;
  region: string;
  tier: string;
  health: HealthState;
  lastSeenAt: ISODateTime;
  matchedOn: "email" | "customer-id" | "session-id" | "transaction-id" | "name";
}

/* ---------------------------------- Ask ---------------------------------- */

export type AskAnswerSectionKind =
  | "summary"
  | "impact"
  | "cause"
  | "evidence"
  | "path"
  | "recommendation"
  | "data-gap";

export interface AskAnswer {
  id: string;
  question: string;
  askedAt: ISODateTime;
  /** Two or three sentences a CIO can read aloud. */
  executiveSummary: string;
  impact?: BusinessImpact;
  rootCause?: RootCause;
  citations: Citation[];
  evidence: Evidence[];
  path?: GraphPath;
  graph?: GraphQueryResult;
  recommendations: Recommendation[];
  followUps: string[];
  confidence: import("./core").Confidence;
  investigation: InvestigationTrace;
  /** Named gaps — what the answer could not establish and why. */
  limitations: string[];
  relatedEntityIds: string[];
}

export interface AskSuggestion {
  id: string;
  question: string;
  category: "impact" | "cause" | "trace" | "change" | "risk" | "action";
  /** Why this is worth asking right now. */
  context: string;
}

/* ------------------------------- Executive -------------------------------- */

export interface ExecutiveInsight {
  id: string;
  title: string;
  narrative: string;
  category:
    | "experience-trend"
    | "revenue-trend"
    | "recurring-incident"
    | "problem-application"
    | "problem-journey"
    | "regional"
    | "change-quality"
    | "reliability"
    | "risk";
  direction: "improving" | "worsening" | "stable";
  metric: { label: string; value: string; deltaPct?: number };
  series?: TimeSeries;
  evidenceIds: string[];
  recommendationId?: string;
}

export interface ExecutiveInsightsPayload {
  period: string;
  insights: ExecutiveInsight[];
  trends: {
    experience: TimeSeries;
    valueAtRisk: TimeSeries;
    incidentCount: TimeSeries;
    changeFailureRate: TimeSeries;
  };
  topProblemApplications: Array<{ applicationId: string; name: string; incidents: number; valueAtRisk: Money }>;
  topProblemJourneys: Array<{ journeyId: string; name: string; breaches: number; valueAtRisk: Money }>;
  recurringIncidents: Array<{ signature: string; occurrences: number; lastAt: ISODateTime; incidentIds: string[] }>;
  availability: Availability;
}

/* --------------------------------- Impact --------------------------------- */

export interface ImpactAnalysisPayload {
  blastRadius: BlastRadius;
  alternatives: Array<{ scenario: BlastRadius["scenario"]; label: string; description: string }>;
}

/* --------------------------------- Sources -------------------------------- */

export interface IngestSource {
  id: string;
  system: string;
  category: string;
  status: "connected" | "degraded" | "disconnected";
  entitiesContributed: number;
  factsContributed: number;
  lastSyncAt: ISODateTime;
  latencySeconds: number;
}

export interface ExperiencePayload extends ExperienceOverview {
  journeys: Array<{ journeyId: string; name: string; health: HealthState; score: number }>;
  geography: GeographicImpact[];
}

export type { GraphQueryResult, GraphPath, BlastRadius, BusinessImpact };
