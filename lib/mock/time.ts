import type { TimeRange, TimeRangeKey } from "@/types";
import { DEMO_NOW } from "@/lib/utils/clock";

interface RangeSpec {
  key: TimeRangeKey;
  label: string;
  shortLabel: string;
  minutes: number;
  /** Samples returned for a series over this window. */
  samples: number;
  comparison: string;
}

export const RANGE_SPECS: Record<TimeRangeKey, RangeSpec> = {
  "1h": { key: "1h", label: "Last hour", shortLabel: "1H", minutes: 60, samples: 60, comparison: "vs. previous hour" },
  "6h": { key: "6h", label: "Last 6 hours", shortLabel: "6H", minutes: 360, samples: 72, comparison: "vs. previous 6 hours" },
  "24h": { key: "24h", label: "Last 24 hours", shortLabel: "24H", minutes: 1_440, samples: 96, comparison: "vs. previous 24 hours" },
  "7d": { key: "7d", label: "Last 7 days", shortLabel: "7D", minutes: 10_080, samples: 84, comparison: "vs. previous 7 days" },
  "30d": { key: "30d", label: "Last 30 days", shortLabel: "30D", minutes: 43_200, samples: 90, comparison: "vs. previous 30 days" },
  "90d": { key: "90d", label: "Last 90 days", shortLabel: "90D", minutes: 129_600, samples: 90, comparison: "vs. previous 90 days" },
};

export const RANGE_KEYS: TimeRangeKey[] = ["1h", "6h", "24h", "7d", "30d", "90d"];

export const DEFAULT_RANGE_KEY: TimeRangeKey = "24h";

export function resolveRange(key: TimeRangeKey): TimeRange {
  const spec = RANGE_SPECS[key] ?? RANGE_SPECS[DEFAULT_RANGE_KEY];
  const to = DEMO_NOW;
  const from = new Date(to.getTime() - spec.minutes * 60_000);
  return { key: spec.key, label: spec.label, from: from.toISOString(), to: to.toISOString() };
}

export function rangeSamples(key: TimeRangeKey): number {
  return (RANGE_SPECS[key] ?? RANGE_SPECS[DEFAULT_RANGE_KEY]).samples;
}

export function rangeComparison(key: TimeRangeKey): string {
  return (RANGE_SPECS[key] ?? RANGE_SPECS[DEFAULT_RANGE_KEY]).comparison;
}

export function rangeMinutes(key: TimeRangeKey): number {
  return (RANGE_SPECS[key] ?? RANGE_SPECS[DEFAULT_RANGE_KEY]).minutes;
}
