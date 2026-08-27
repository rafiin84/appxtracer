import type {
  Criticality,
  HealthState,
  ISODateTime,
  Money,
  Owner,
  RegionCode,
  TimeSeries,
  Trend,
} from "./core";

export type ApplicationKind =
  | "web"
  | "mobile"
  | "api"
  | "backend"
  | "batch"
  | "edge";

export type RuntimeEnvironment = "production" | "staging" | "disaster-recovery";

export interface Application {
  id: string;
  name: string;
  kind: ApplicationKind;
  description: string;
  environment: RuntimeEnvironment;
  criticality: Criticality;
  owner: Owner;
  health: HealthState;
  healthScore: number;
  journeyIds: string[];
  serviceIds: string[];
  /** Direct downstream dependencies, application or service scoped. */
  dependencyIds: string[];
  customersAffected: number;
  customersServed: number;
  p95LatencyMs: number;
  latencyTrend: Trend;
  errorRatePct: number;
  errorRateTrend: Trend;
  throughputRps: number;
  availabilityPct: number;
  apdex: number;
  valueAtRisk: Money;
  observedValue: Money;
  regions: RegionCode[];
  series: {
    latency: TimeSeries;
    errorRate: TimeSeries;
    throughput: TimeSeries;
  };
  incidentIds: string[];
  changeIds: string[];
  likelyRootCauseId?: string;
  degradedSince?: ISODateTime;
  /** Observability sources contributing telemetry for this application. */
  sourceIds: string[];
}

export type ServiceKind =
  | "service"
  | "api"
  | "database"
  | "queue"
  | "cache"
  | "cdn"
  | "third-party";

export interface Service {
  id: string;
  name: string;
  kind: ServiceKind;
  applicationId?: string;
  owner: Owner;
  environment: RuntimeEnvironment;
  health: HealthState;
  p95LatencyMs: number;
  errorRatePct: number;
  throughputRps: number;
  saturationPct?: number;
  dependencyIds: string[];
  infrastructureIds: string[];
  region: RegionCode[];
  series?: {
    latency?: TimeSeries;
    errorRate?: TimeSeries;
    saturation?: TimeSeries;
  };
  incidentIds: string[];
  changeIds: string[];
  /** Third-party services carry a vendor name for evidence attribution. */
  vendor?: string;
}

export type DependencyKind =
  | "synchronous"
  | "asynchronous"
  | "data"
  | "network"
  | "third-party";

export interface Dependency {
  id: string;
  fromId: string;
  toId: string;
  kind: DependencyKind;
  /** Share of the caller's traffic that traverses this edge. */
  trafficSharePct: number;
  p95LatencyMs: number;
  errorRatePct: number;
  health: HealthState;
  critical: boolean;
  evidenceIds: string[];
}
