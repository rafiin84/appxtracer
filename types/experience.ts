import type {
  HealthState,
  ISODateTime,
  Money,
  RegionCode,
  TimeSeries,
  Trend,
} from "./core";

export type DeviceKind = "ios" | "android" | "web-desktop" | "web-mobile" | "api-client";

export interface User {
  id: string;
  customerId: string;
  device: DeviceKind;
  appVersion: string;
  locale: string;
}

export type SessionOutcome = "completed" | "abandoned" | "errored" | "active";

export interface Session {
  id: string;
  customerId: string;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  durationMs: number;
  device: DeviceKind;
  appVersion: string;
  region: RegionCode;
  city: string;
  /** Coarse network descriptor — never a raw client IP. */
  network: string;
  outcome: SessionOutcome;
  experienceScore: number;
  journeyIds: string[];
  interactionCount: number;
  errorCount: number;
}

export type InteractionKind =
  | "page-view"
  | "tap"
  | "form-submit"
  | "api-call"
  | "payment-attempt"
  | "search"
  | "error";

export interface Interaction {
  id: string;
  sessionId: string;
  at: ISODateTime;
  kind: InteractionKind;
  label: string;
  journeyId?: string;
  journeyStepId?: string;
  applicationId?: string;
  durationMs?: number;
  status: "ok" | "slow" | "error";
  detail?: string;
  traceId?: string;
  evidenceIds: string[];
}

export type ExperienceEventKind =
  | "slow-response"
  | "error-response"
  | "timeout"
  | "crash"
  | "rage-tap"
  | "abandonment";

export interface ExperienceEvent {
  id: string;
  at: ISODateTime;
  kind: ExperienceEventKind;
  customerId?: string;
  sessionId?: string;
  journeyId?: string;
  applicationId?: string;
  region: RegionCode;
  severity: "low" | "medium" | "high";
  summary: string;
  evidenceIds: string[];
}

export interface ExperienceScore {
  /** 0–100 composite of latency, errors, availability and completion. */
  value: number;
  band: "excellent" | "good" | "fair" | "poor";
  trend: Trend;
  components: Array<{
    key: "latency" | "errors" | "availability" | "completion";
    label: string;
    value: number;
    weight: number;
    health: HealthState;
  }>;
}

export interface ExperienceSegment {
  id: string;
  label: string;
  dimension: "region" | "device" | "app-version" | "customer-tier" | "network";
  customersAffected: number;
  customersTotal: number;
  experienceScore: number;
  health: HealthState;
  p95LatencyMs: number;
  errorRatePct: number;
  valueAtRisk?: Money;
}

export interface ExperienceOverview {
  score: ExperienceScore;
  availabilityPct: number;
  p95LatencyMs: number;
  errorRatePct: number;
  apdex: number;
  activeCustomers: number;
  affectedCustomers: number;
  series: {
    experience: TimeSeries;
    latency: TimeSeries;
    errorRate: TimeSeries;
    availability: TimeSeries;
  };
  segments: ExperienceSegment[];
  worstSegmentId?: string;
}
