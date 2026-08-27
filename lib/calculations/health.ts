import type { HealthState, Trend } from "@/types";

/**
 * Health and trend helpers.
 *
 * Health is carried by the data rather than computed at render time, but these
 * helpers give the UI a single place to decide ordering, aggregation and
 * whether a movement is good news.
 */
const RANK: Record<HealthState, number> = {
  critical: 0,
  impaired: 1,
  degraded: 2,
  healthy: 3,
  unknown: 4,
};

export function worstHealth(states: HealthState[]): HealthState {
  if (!states.length) return "unknown";
  return states.reduce((worst, s) => (RANK[s] < RANK[worst] ? s : worst), states[0]);
}

export function byHealth<T>(items: T[], get: (item: T) => HealthState): T[] {
  return [...items].sort((a, b) => RANK[get(a)] - RANK[get(b)]);
}

export function isUnhealthy(state: HealthState): boolean {
  return state === "degraded" || state === "impaired" || state === "critical";
}

/** Whether a trend movement is good, bad or neither, given its polarity. */
export type TrendSentiment = "good" | "bad" | "neutral";

export function trendSentiment(trend: Trend): TrendSentiment {
  if (trend.direction === "flat" || trend.polarity === "neutral") return "neutral";
  const improving =
    (trend.polarity === "up-is-good" && trend.direction === "up") ||
    (trend.polarity === "down-is-good" && trend.direction === "down");
  return improving ? "good" : "bad";
}

/** Score → band, used for experience scores and journey health scores. */
export function scoreBand(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 55) return "fair";
  return "poor";
}

export function scoreHealth(score: number): HealthState {
  if (score >= 88) return "healthy";
  if (score >= 70) return "degraded";
  if (score >= 45) return "impaired";
  return "critical";
}
