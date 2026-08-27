import type {
  Confidence,
  CurrencyCode,
  HealthState,
  ISODateTime,
  Money,
  Provenance,
  Severity,
} from "@/types";
import { DEMO_NOW } from "@/lib/utils/clock";

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  SGD: "S$",
  BRL: "R$",
};

/** 1,284 · 12.9K · 4.7M · 1.2B — proportional figures, no forced precision. */
export function formatCompactNumber(value: number, fractionDigits = 1): string {
  const abs = Math.abs(value);
  if (abs < 1_000) return String(Math.round(value));
  if (abs < 1_000_000) {
    const n = value / 1_000;
    return `${trimZero(n.toFixed(abs < 10_000 ? fractionDigits : 0))}K`;
  }
  if (abs < 1_000_000_000) {
    return `${trimZero((value / 1_000_000).toFixed(fractionDigits))}M`;
  }
  return `${trimZero((value / 1_000_000_000).toFixed(fractionDigits))}B`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function trimZero(s: string): string {
  return s.replace(/\.0+$/, "");
}

/** `$4.7M`. Never rendered without a provenance label beside it. */
export function formatMoneyCompact(money: Money): string {
  return `${CURRENCY_SYMBOL[money.currency]}${formatCompactNumber(money.amount)}`;
}

export function formatMoneyExact(money: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/**
 * The word that must accompany every monetary figure. Modelled numbers are
 * never allowed to read as accounting facts.
 */
export function moneyQualifier(provenance: Provenance): string {
  return provenance === "observed" ? "Observed" : "Estimated";
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const d = abs >= 10 ? Math.min(digits, 1) : digits;
  return `${trimZero(value.toFixed(d))}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPercent(Math.abs(value), digits)}`;
}

export function formatLatency(ms: number): string {
  if (ms < 1) return "<1 ms";
  if (ms < 1_000) return `${Math.round(ms)} ms`;
  return `${trimZero((ms / 1_000).toFixed(ms < 10_000 ? 2 : 1))} s`;
}

export function formatDurationMs(ms: number): string {
  if (ms < 1_000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1_000;
  if (seconds < 60) return `${trimZero(seconds.toFixed(1))}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${trimZero(hours.toFixed(1))} hr`;
  return `${trimZero((hours / 24).toFixed(1))} d`;
}

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const TIME_SECONDS_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "UTC",
});
const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatTime(iso: ISODateTime, withSeconds = false): string {
  const d = new Date(iso);
  return `${(withSeconds ? TIME_SECONDS_FMT : TIME_FMT).format(d)} UTC`;
}

export function formatDate(iso: ISODateTime): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatDateTime(iso: ISODateTime): string {
  return `${DATETIME_FMT.format(new Date(iso))} UTC`;
}

/** Relative to the demo clock, so the narrative never drifts. */
export function formatRelative(iso: ISODateTime, reference: Date = DEMO_NOW): string {
  const deltaMs = reference.getTime() - new Date(iso).getTime();
  const future = deltaMs < 0;
  const abs = Math.abs(deltaMs);
  const minutes = Math.round(abs / 60_000);
  let label: string;
  if (minutes < 1) label = "just now";
  else if (minutes < 60) label = `${minutes} min`;
  else if (minutes < 60 * 24) label = `${Math.round(minutes / 60)} hr`;
  else if (minutes < 60 * 24 * 30) label = `${Math.round(minutes / (60 * 24))} d`;
  else if (minutes < 60 * 24 * 365) label = `${Math.round(minutes / (60 * 24 * 30))} mo`;
  else label = `${trimZero((minutes / (60 * 24 * 365)).toFixed(1))} yr`;
  if (label === "just now") return label;
  return future ? `in ${label}` : `${label} ago`;
}

export const HEALTH_LABEL: Record<HealthState, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  impaired: "Impaired",
  critical: "Critical",
  unknown: "No data",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  sev1: "Sev 1",
  sev2: "Sev 2",
  sev3: "Sev 3",
  sev4: "Sev 4",
};

export const SEVERITY_DESCRIPTION: Record<Severity, string> = {
  sev1: "Critical business impact",
  sev2: "Major business impact",
  sev3: "Moderate business impact",
  sev4: "Minor business impact",
};

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  observed: "Observed",
  derived: "Derived",
  interpreted: "AI interpretation",
};

export const PROVENANCE_DESCRIPTION: Record<Provenance, string> = {
  observed: "Read directly from a system of record — telemetry, a transaction, a change record.",
  derived: "Produced by the graph: an inference, a correlation or a calculation over observed facts.",
  interpreted: "A model-written explanation, hypothesis or recommendation, grounded in the linked evidence.",
};

export function formatConfidence(confidence: Confidence): string {
  return `${Math.round(confidence.value * 100)}% · ${confidence.band}`;
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

/** "18,420 customers" with the count already compacted for hero surfaces. */
export function formatCustomers(count: number, compact = false): string {
  const n = compact ? formatCompactNumber(count) : formatNumber(count);
  return `${n} ${pluralise(count, "customer")}`;
}

export function formatUnit(value: number, unit: string): string {
  switch (unit) {
    case "ms":
      return formatLatency(value);
    case "pct":
      return formatPercent(value);
    case "currency":
      // Small currency amounts keep their cents; large ones compact.
      return Math.abs(value) < 1_000
        ? `$${value.toFixed(2)}`
        : `$${formatCompactNumber(value)}`;
    case "score":
      return trimZero(value.toFixed(1));
    default:
      return formatCompactNumber(value);
  }
}
