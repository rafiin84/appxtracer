import type { ExperienceSegment, ExperiencePayload, TimeRangeKey } from "@/types";
import { scoreBand } from "@/lib/calculations/health";
import { buildSeries, makeTrend, trendFromSeries } from "./telemetry";
import { T, WINDOW_IMPACT } from "./narrative";
import { buildGeography } from "./impact";
import { buildJourneys } from "./journeys";
import { usd } from "./primitives";

const SEGMENTS: Array<Omit<ExperienceSegment, "valueAtRisk"> & { atRisk?: number }> = [
  { id: "seg-region-us-east", label: "US East", dimension: "region", customersAffected: 11_236, customersTotal: 940_000, experienceScore: 41, health: "critical", p95LatencyMs: 3_840, errorRatePct: 12.4, atRisk: 3_010_000 },
  { id: "seg-region-us-west", label: "US West", dimension: "region", customersAffected: 4_180, customersTotal: 468_000, experienceScore: 46, health: "critical", p95LatencyMs: 3_420, errorRatePct: 10.8, atRisk: 998_000 },
  { id: "seg-region-eu-west", label: "EU West", dimension: "region", customersAffected: 3_420, customersTotal: 512_000, experienceScore: 58, health: "impaired", p95LatencyMs: 2_140, errorRatePct: 6.2, atRisk: 816_000 },
  { id: "seg-region-eu-central", label: "EU Central", dimension: "region", customersAffected: 3_180, customersTotal: 404_000, experienceScore: 54, health: "impaired", p95LatencyMs: 2_480, errorRatePct: 6.8, atRisk: 758_000 },
  { id: "seg-region-ap-south", label: "AP South", dimension: "region", customersAffected: 1_240, customersTotal: 386_000, experienceScore: 74, health: "degraded", p95LatencyMs: 1_180, errorRatePct: 2.1, atRisk: 296_000 },
  { id: "seg-region-ap-southeast", label: "AP Southeast", dimension: "region", customersAffected: 902, customersTotal: 268_000, experienceScore: 78, health: "degraded", p95LatencyMs: 1_040, errorRatePct: 1.8, atRisk: 216_000 },
  { id: "seg-region-sa-east", label: "SA East", dimension: "region", customersAffected: 622, customersTotal: 162_000, experienceScore: 64, health: "impaired", p95LatencyMs: 1_920, errorRatePct: 4.2, atRisk: 148_000 },

  { id: "seg-device-web-desktop", label: "Web · desktop", dimension: "device", customersAffected: 8_140, customersTotal: 1_284_000, experienceScore: 62, health: "impaired", p95LatencyMs: 1_840, errorRatePct: 5.4 },
  { id: "seg-device-web-mobile", label: "Web · mobile", dimension: "device", customersAffected: 4_020, customersTotal: 896_000, experienceScore: 58, health: "impaired", p95LatencyMs: 2_240, errorRatePct: 6.1 },
  { id: "seg-device-ios", label: "iOS app", dimension: "device", customersAffected: 5_180, customersTotal: 1_042_000, experienceScore: 66, health: "impaired", p95LatencyMs: 1_620, errorRatePct: 4.8 },
  { id: "seg-device-android", label: "Android app", dimension: "device", customersAffected: 6_640, customersTotal: 898_000, experienceScore: 51, health: "critical", p95LatencyMs: 1_980, errorRatePct: 7.9 },

  { id: "seg-tier-premier", label: "Premier", dimension: "customer-tier", customersAffected: 2_140, customersTotal: 184_000, experienceScore: 54, health: "impaired", p95LatencyMs: 2_180, errorRatePct: 6.4, atRisk: 2_410_000 },
  { id: "seg-tier-plus", label: "Plus", dimension: "customer-tier", customersAffected: 7_420, customersTotal: 642_000, experienceScore: 61, health: "impaired", p95LatencyMs: 1_940, errorRatePct: 5.6, atRisk: 1_840_000 },
  { id: "seg-tier-standard", label: "Standard", dimension: "customer-tier", customersAffected: 15_220, customersTotal: 2_314_000, experienceScore: 64, health: "impaired", p95LatencyMs: 1_820, errorRatePct: 5.1, atRisk: 1_992_000 },

  { id: "seg-version-8-42", label: "Mobile 8.42.x", dimension: "app-version", customersAffected: 4_180, customersTotal: 402_000, experienceScore: 48, health: "critical", p95LatencyMs: 2_040, errorRatePct: 8.6 },
  { id: "seg-version-8-41", label: "Mobile 8.41.x", dimension: "app-version", customersAffected: 7_640, customersTotal: 1_538_000, experienceScore: 68, health: "impaired", p95LatencyMs: 1_680, errorRatePct: 4.4 },
];

export function buildExperience(rangeKey: TimeRangeKey): ExperiencePayload {
  const experience = buildSeries(
    {
      id: "experience:score",
      label: "Experience score",
      unit: "score",
      base: 87.4,
      noise: 0.012,
      seasonality: 0.015,
      min: 0,
      max: 100,
      decimals: 1,
      baseline: 90,
      events: [
        { from: T.euLatencyStart, rampMinutes: 20, delta: -3.1 },
        { from: T.journeyDegraded, rampMinutes: 8, delta: -22.4 },
      ],
      markers: [
        { t: T.deploy, label: "Payment deployment", kind: "change", refId: "chg-8841" },
        { t: T.incidentOpened, label: "INC-4417 opened", kind: "incident", refId: "inc-4417" },
      ],
    },
    rangeKey,
  );

  const latency = buildSeries(
    {
      id: "experience:latency",
      label: "p95 latency",
      unit: "ms",
      base: 940,
      noise: 0.07,
      seasonality: 0.11,
      min: 100,
      events: [
        { from: T.euLatencyStart, rampMinutes: 18, multiplier: 1.24 },
        { from: T.journeyDegraded, rampMinutes: 6, multiplier: 1.94 },
      ],
    },
    rangeKey,
  );

  const errorRate = buildSeries(
    {
      id: "experience:error-rate",
      label: "Error rate",
      unit: "pct",
      base: 1.1,
      noise: 0.14,
      min: 0,
      max: 100,
      decimals: 2,
      events: [
        { from: T.euLatencyStart, rampMinutes: 18, delta: 0.4 },
        { from: T.journeyDegraded, rampMinutes: 6, delta: 4.4 },
      ],
    },
    rangeKey,
  );

  const availability = buildSeries(
    {
      id: "experience:availability",
      label: "Availability",
      unit: "pct",
      base: 99.96,
      noise: 0.0004,
      min: 90,
      max: 100,
      decimals: 3,
      baseline: 99.95,
      events: [{ from: T.journeyDegraded, rampMinutes: 6, delta: -1.62 }],
    },
    rangeKey,
  );

  const journeys = buildJourneys(rangeKey);
  const score = 62.1;

  return {
    score: {
      value: score,
      band: scoreBand(score),
      trend: trendFromSeries(experience, "up-is-good", rangeKey),
      components: [
        { key: "latency", label: "Speed", value: 48, weight: 0.3, health: "critical" },
        { key: "errors", label: "Reliability", value: 51, weight: 0.3, health: "critical" },
        { key: "availability", label: "Availability", value: 96, weight: 0.2, health: "healthy" },
        { key: "completion", label: "Task completion", value: 71, weight: 0.2, health: "impaired" },
      ],
    },
    availabilityPct: 98.34,
    p95LatencyMs: 1_824,
    errorRatePct: 5.9,
    apdex: 0.61,
    activeCustomers: WINDOW_IMPACT.customersActive,
    affectedCustomers: WINDOW_IMPACT.customersAffected,
    series: { experience, latency, errorRate, availability },
    segments: SEGMENTS.map((s) => ({
      ...s,
      valueAtRisk: s.atRisk !== undefined ? usd(s.atRisk) : undefined,
    })),
    worstSegmentId: "seg-region-us-east",
    journeys: journeys.map((j) => ({
      journeyId: j.id,
      name: j.name,
      health: j.health,
      score: j.healthScore,
    })),
    geography: buildGeography(),
  };
}

export { makeTrend };
