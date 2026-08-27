import type {
  ISODateTime,
  MetricPoint,
  MetricUnit,
  SeriesMarker,
  TimeRangeKey,
  TimeSeries,
  Trend,
  TrendPolarity,
} from "@/types";
import { createRng } from "@/lib/utils/random";
import { DEMO_NOW } from "@/lib/utils/clock";
import { rangeComparison, rangeMinutes, rangeSamples } from "./time";

/**
 * Deterministic telemetry shaping.
 *
 * Series are generated, never stored, so every window (1h through 90d) is
 * internally consistent with the same incident narrative: the checkout event
 * that starts at 14:31 UTC is visible as a sharp step in the 1h view and as a
 * single afternoon notch in the 30d view.
 */
export interface SeriesEvent {
  /** When the effect starts. */
  from: ISODateTime;
  /** When the effect ends. Omitted means "still in effect". */
  to?: ISODateTime;
  /** Multiplier applied at full strength, e.g. 8.4 for a latency blow-up. */
  multiplier?: number;
  /** Absolute delta applied at full strength, used for rates and percentages. */
  delta?: number;
  /** Minutes taken to reach full strength. */
  rampMinutes?: number;
  /** Minutes taken to fall back after `to`. */
  decayMinutes?: number;
}

export interface SeriesSpec {
  id: string;
  label: string;
  unit: MetricUnit;
  base: number;
  /** Peak-to-trough noise as a fraction of base. */
  noise?: number;
  /** Daily seasonality amplitude as a fraction of base. */
  seasonality?: number;
  /** Signed drift across the whole window, as a fraction of base. */
  drift?: number;
  baseline?: number;
  min?: number;
  max?: number;
  decimals?: number;
  events?: SeriesEvent[];
  markers?: SeriesMarker[];
}

function clamp(value: number, min?: number, max?: number): number {
  let v = value;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

/** Effect strength of an event at instant `t`, 0 → 1 → 0. */
function eventStrength(event: SeriesEvent, t: number): number {
  const from = new Date(event.from).getTime();
  const ramp = (event.rampMinutes ?? 3) * 60_000;
  const to = event.to ? new Date(event.to).getTime() : Number.POSITIVE_INFINITY;
  const decay = (event.decayMinutes ?? 12) * 60_000;

  if (t < from) return 0;
  if (t < from + ramp) return (t - from) / ramp;
  if (t <= to) return 1;
  if (t < to + decay) return 1 - (t - to) / decay;
  return 0;
}

export function buildSeries(spec: SeriesSpec, rangeKey: TimeRangeKey): TimeSeries {
  const samples = rangeSamples(rangeKey);
  const totalMinutes = rangeMinutes(rangeKey);
  const stepMs = (totalMinutes * 60_000) / (samples - 1);
  const startMs = DEMO_NOW.getTime() - totalMinutes * 60_000;
  const rng = createRng(`${spec.id}:${rangeKey}`);
  const decimals = spec.decimals ?? (spec.unit === "pct" || spec.unit === "score" ? 2 : 0);

  const points: MetricPoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const t = startMs + i * stepMs;
    const progress = i / (samples - 1);

    // Diurnal shape: commerce traffic peaks late afternoon UTC.
    const hourOfDay = ((t / 3_600_000) % 24 + 24) % 24;
    const seasonal =
      (spec.seasonality ?? 0) * Math.sin(((hourOfDay - 4) / 24) * Math.PI * 2);

    const drift = (spec.drift ?? 0) * (progress - 0.5) * 2;
    const noise = (spec.noise ?? 0.04) * (rng() - 0.5) * 2;

    let value = spec.base * (1 + seasonal + drift + noise);

    for (const event of spec.events ?? []) {
      const strength = eventStrength(event, t);
      if (strength <= 0) continue;
      if (event.multiplier !== undefined) {
        value *= 1 + (event.multiplier - 1) * strength;
      }
      if (event.delta !== undefined) {
        value += event.delta * strength;
      }
    }

    const rounded = Number(clamp(value, spec.min, spec.max).toFixed(decimals));
    points.push({ t: new Date(t).toISOString(), v: rounded });
  }

  return {
    id: spec.id,
    label: spec.label,
    unit: spec.unit,
    points,
    baseline: spec.baseline,
    markers: spec.markers?.filter((m) => new Date(m.t).getTime() >= startMs),
  };
}

/** Mean of the first and last thirds, so a trend reads the window, not one sample. */
export function trendFromSeries(
  series: TimeSeries,
  polarity: TrendPolarity,
  rangeKey: TimeRangeKey,
): Trend {
  const points = series.points;
  if (points.length < 6) {
    return { direction: "flat", changePct: 0, polarity, comparedTo: rangeComparison(rangeKey) };
  }
  const third = Math.max(2, Math.floor(points.length / 3));
  const head = points.slice(0, third).reduce((s, p) => s + p.v, 0) / third;
  const tail = points.slice(-third).reduce((s, p) => s + p.v, 0) / third;
  const changePct = head === 0 ? 0 : ((tail - head) / Math.abs(head)) * 100;
  const direction = Math.abs(changePct) < 0.75 ? "flat" : changePct > 0 ? "up" : "down";
  return {
    direction,
    changePct: Number(changePct.toFixed(1)),
    polarity,
    comparedTo: rangeComparison(rangeKey),
  };
}

export function makeTrend(
  changePct: number,
  polarity: TrendPolarity,
  rangeKey: TimeRangeKey,
): Trend {
  return {
    direction: Math.abs(changePct) < 0.75 ? "flat" : changePct > 0 ? "up" : "down",
    changePct,
    polarity,
    comparedTo: rangeComparison(rangeKey),
  };
}

export function lastValue(series: TimeSeries): number {
  return series.points[series.points.length - 1]?.v ?? 0;
}

export function seriesMax(series: TimeSeries): number {
  return series.points.reduce((m, p) => Math.max(m, p.v), Number.NEGATIVE_INFINITY);
}

export function seriesMin(series: TimeSeries): number {
  return series.points.reduce((m, p) => Math.min(m, p.v), Number.POSITIVE_INFINITY);
}
