/**
 * Primitives shared by every APPX Tracer domain model.
 *
 * These are deliberately transport-agnostic: the mock API in `lib/mock` and a
 * future production API are expected to serialise to exactly these shapes.
 */

/** ISO-8601 timestamp, always UTC with an explicit offset. */
export type ISODateTime = string;

/** Opaque identifiers, branded so they cannot be crossed accidentally. */
export type Id<TKind extends string> = string & { readonly __kind?: TKind };

export type HealthState =
  | "healthy"
  | "degraded"
  | "impaired"
  | "critical"
  | "unknown";

export const HEALTH_ORDER: readonly HealthState[] = [
  "critical",
  "impaired",
  "degraded",
  "healthy",
  "unknown",
];

export type Severity = "sev1" | "sev2" | "sev3" | "sev4";

export type Criticality =
  | "mission-critical"
  | "business-critical"
  | "important"
  | "standard";

export type TrendDirection = "up" | "down" | "flat";

/** Whether an upward move is a good thing for this measure. */
export type TrendPolarity = "up-is-good" | "down-is-good" | "neutral";

export interface Trend {
  direction: TrendDirection;
  /** Signed percentage change against the comparison window. */
  changePct: number;
  polarity: TrendPolarity;
  /** Human label for the comparison window, e.g. "vs. previous 24h". */
  comparedTo: string;
}

/**
 * How a fact came to exist. This drives the trust affordances across the UI and
 * must never be inferred at render time — it is carried with the data.
 */
export type Provenance =
  | "observed" // direct telemetry, an actual transaction, an actual change record
  | "derived" // graph inference, correlation, calculation
  | "interpreted"; // model explanation, hypothesis, recommendation

export type ConfidenceBand = "low" | "medium" | "high";

export interface Confidence {
  /** 0–1. */
  value: number;
  band: ConfidenceBand;
  /** Why the system is (or is not) confident. Always human-readable. */
  rationale: string;
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "SGD" | "BRL";

/** A monetary quantity that always declares whether it was observed or modelled. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
  provenance: Extract<Provenance, "observed" | "derived">;
}

export interface MetricPoint {
  t: ISODateTime;
  v: number;
}

export type MetricUnit =
  | "ms"
  | "pct"
  | "count"
  | "rps"
  | "currency"
  | "score"
  | "ratio";

export interface TimeSeries {
  id: string;
  label: string;
  unit: MetricUnit;
  points: MetricPoint[];
  /** Optional baseline the series is judged against (SLO, previous period). */
  baseline?: number;
  /** Optional annotated moments — deployments, incident start, mitigation. */
  markers?: SeriesMarker[];
}

export interface SeriesMarker {
  t: ISODateTime;
  label: string;
  kind: "change" | "incident" | "mitigation" | "slo";
  refId?: string;
}

export type TimeRangeKey = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

export interface TimeRange {
  key: TimeRangeKey;
  label: string;
  from: ISODateTime;
  to: ISODateTime;
}

export type RegionCode =
  | "us-east"
  | "us-west"
  | "eu-west"
  | "eu-central"
  | "ap-south"
  | "ap-southeast"
  | "sa-east";

export interface Region {
  code: RegionCode;
  name: string;
  /** Representative city used for map/geo labelling. */
  hub: string;
  /** Normalised x/y on an equirectangular projection (0–1). */
  x: number;
  y: number;
}

export interface EnvironmentRef {
  id: string;
  name: string;
  kind: "production" | "staging" | "disaster-recovery";
  tenant: string;
}

export type DataAvailability = "available" | "partial" | "unavailable";

/**
 * Wraps any panel payload so a screen can honestly render "we have experience
 * data but no revenue data for this window" instead of inventing a number.
 */
export interface Availability {
  state: DataAvailability;
  /** Named data domains that are missing, e.g. ["revenue", "session-replay"]. */
  missing?: string[];
  note?: string;
}

export interface Owner {
  id: string;
  name: string;
  role: string;
  team: string;
  /** Contact is intentionally a team handle, never a personal email. */
  handle: string;
}
