import type {
  Availability,
  BlastRadius,
  GeographicImpact,
  GraphPath,
  ImpactedEntity,
  ImpactSummary,
  RegionCode,
  TimeRangeKey,
} from "@/types";
import { businessImpact, valueAtRisk } from "@/lib/calculations/impact";
import { dataset, reachedByFailure, shortestPath } from "@/lib/graph/engine";
import { REGIONS } from "./company";
import { T, WINDOW_IMPACT } from "./narrative";
import { confidence, observed, usd } from "./primitives";
import { buildSeries, makeTrend } from "./telemetry";
import { CURATED_PATHS_BY_ID } from "./paths";
import { buildJourneys } from "./journeys";

const GEO: Array<{
  region: RegionCode;
  affected: number;
  active: number;
  health: GeographicImpact["health"];
  score: number;
  atRisk: number;
  topJourneyId: string;
}> = [
  { region: "us-east", affected: 11_236, active: 940_000, health: "critical", score: 41, atRisk: 3_010_000, topJourneyId: "jny-checkout" },
  { region: "us-west", affected: 4_180, active: 468_000, health: "critical", score: 46, atRisk: 998_000, topJourneyId: "jny-checkout" },
  { region: "eu-west", affected: 3_420, active: 512_000, health: "impaired", score: 58, atRisk: 816_000, topJourneyId: "jny-checkout" },
  { region: "eu-central", affected: 3_180, active: 404_000, health: "impaired", score: 54, atRisk: 758_000, topJourneyId: "jny-search" },
  { region: "ap-south", affected: 1_240, active: 386_000, health: "degraded", score: 74, atRisk: 296_000, topJourneyId: "jny-checkout" },
  { region: "ap-southeast", affected: 902, active: 268_000, health: "degraded", score: 78, atRisk: 216_000, topJourneyId: "jny-checkout" },
  { region: "sa-east", affected: 622, active: 162_000, health: "impaired", score: 64, atRisk: 148_000, topJourneyId: "jny-checkout" },
];

export function buildGeography(): GeographicImpact[] {
  return GEO.map((g) => ({
    region: REGIONS[g.region],
    customersAffected: g.affected,
    customersActive: g.active,
    health: g.health,
    experienceScore: g.score,
    valueAtRisk: usd(g.atRisk),
    topJourneyId: g.topJourneyId,
  }));
}

/**
 * Revenue is available but four minutes behind the experience feed, which the
 * UI must say rather than quietly extrapolate.
 */
export const WINDOW_AVAILABILITY: Availability = {
  state: "partial",
  missing: ["revenue (last 4 minutes)", "session replay"],
  note: "Revenue ledger last settled at 15:08 UTC. Figures for the final four minutes are experience-derived. Session replay is sampled at 2% and has no capture for most affected sessions.",
};

export function buildImpactSummary(rangeKey: TimeRangeKey): ImpactSummary {
  const customersAffected = buildSeries(
    {
      id: "impact:customers-affected",
      label: "Customers affected",
      unit: "count",
      base: 620,
      noise: 0.18,
      seasonality: 0.12,
      min: 0,
      events: [
        { from: T.euLatencyStart, rampMinutes: 20, delta: 3_400 },
        { from: T.journeyDegraded, rampMinutes: 8, delta: 19_800 },
      ],
    },
    rangeKey,
  );

  const valueAtRiskSeries = buildSeries(
    {
      id: "impact:value-at-risk",
      label: "Transaction value at risk",
      unit: "currency",
      base: 84_000,
      noise: 0.12,
      seasonality: 0.15,
      min: 0,
      events: [
        { from: T.euLatencyStart, rampMinutes: 20, delta: 380_000 },
        { from: T.journeyDegraded, rampMinutes: 8, delta: 5_600_000 },
      ],
    },
    rangeKey,
  );

  return {
    totalCustomersAffected: WINDOW_IMPACT.customersAffected,
    totalCustomersActive: WINDOW_IMPACT.customersActive,
    affectedPct: Number(
      ((WINDOW_IMPACT.customersAffected / WINDOW_IMPACT.customersActive) * 100).toFixed(2),
    ),
    affectedTrend: makeTrend(1_842.0, "down-is-good", rangeKey),
    valueAtRisk: usd(WINDOW_IMPACT.valueAtRisk.amount),
    observedValueLost: observed(WINDOW_IMPACT.observedValueLost.amount),
    valueAtRiskTrend: makeTrend(2_140.0, "down-is-good", rangeKey),
    transactionsFailed: WINDOW_IMPACT.transactionsFailed,
    regions: GEO.map((g) => g.region),
    series: { customersAffected, valueAtRisk: valueAtRiskSeries },
    geography: buildGeography(),
    availability: WINDOW_AVAILABILITY,
  };
}

/* ------------------------------ Blast radius ------------------------------ */

interface ScenarioProfile {
  label: string;
  description: string;
  /** Multiplier applied to the modelled customer and value figures. */
  severity: number;
  depth: number;
}

const SCENARIOS: Record<BlastRadius["scenario"], ScenarioProfile> = {
  "current-degradation": {
    label: "Current degradation",
    description: "What is affected right now, at the observed level of degradation.",
    severity: 1,
    depth: 4,
  },
  "total-failure": {
    label: "Total failure",
    description: "What breaks if this entity becomes completely unavailable.",
    severity: 3.4,
    depth: 4,
  },
  "regional-failure": {
    label: "Regional failure",
    description: "What breaks if this entity fails in one region only.",
    severity: 1.6,
    depth: 4,
  },
};

const ORIGIN_PROFILE: Record<
  string,
  { customersPerHop: number; valuePerHop: number; transactionsFailed: number }
> = {
  "db-payments-primary": { customersPerHop: 41_800, valuePerHop: 3_940_000, transactionsFailed: 48_600 },
  "svc-payment-service": { customersPerHop: 38_400, valuePerHop: 3_620_000, transactionsFailed: 44_200 },
  "app-payments": { customersPerHop: 38_400, valuePerHop: 3_620_000, transactionsFailed: 44_200 },
  "svc-identity-token": { customersPerHop: 62_400, valuePerHop: 1_240_000, transactionsFailed: 18_400 },
  "rtr-core-euc1": { customersPerHop: 21_600, valuePerHop: 820_000, transactionsFailed: 12_400 },
  "db-orders-primary": { customersPerHop: 28_400, valuePerHop: 2_840_000, transactionsFailed: 31_200 },
};

const DEFAULT_PROFILE = { customersPerHop: 8_400, valuePerHop: 420_000, transactionsFailed: 5_200 };

const LAYER_OF: Record<string, ImpactedEntity["layer"]> = {
  journey: "business",
  "journey-step": "business",
  "business-service": "business",
  customer: "experience",
  application: "application",
  api: "application",
  service: "application",
  "third-party": "application",
  database: "platform",
  queue: "platform",
  cache: "platform",
  cdn: "platform",
};

export function buildBlastRadius(
  rangeKey: TimeRangeKey,
  originId: string,
  scenario: BlastRadius["scenario"] = "total-failure",
): BlastRadius | undefined {
  const ds = dataset(rangeKey);
  const origin = ds.nodesById.get(originId);
  if (!origin) return undefined;

  const profile = SCENARIOS[scenario];
  const impactProfile = ORIGIN_PROFILE[originId] ?? DEFAULT_PROFILE;
  const distances = reachedByFailure(ds, originId, profile.depth);

  const journeys = buildJourneys(rangeKey);
  const journeyById = new Map(journeys.map((j) => [j.id, j]));

  const entities: ImpactedEntity[] = [];
  for (const [id, distance] of distances) {
    if (id === originId) continue;
    const n = ds.nodesById.get(id);
    if (!n) continue;
    if (n.kind === "change" || n.kind === "incident" || n.kind === "evidence") continue;

    const decay = 1 / (1 + distance * 0.55);
    const journey = journeyById.get(id);
    const customersAffected = journey
      ? Math.round(journey.customersInWindow * 0.72 * Math.min(1, profile.severity / 3.4))
      : Math.round(impactProfile.customersPerHop * decay * Math.min(1.6, profile.severity / 2));

    entities.push({
      id,
      label: n.label,
      kind: n.kind,
      layer: LAYER_OF[n.kind] ?? "infrastructure",
      status: scenario === "current-degradation" && n.health === "healthy" ? "at-risk" : "affected",
      health: n.health,
      distance,
      customersAffected,
      valueAtRisk: journey
        ? usd(Math.round(journey.observedValue.amount * 0.11 * Math.min(1, profile.severity / 3.4)))
        : usd(Math.round(impactProfile.valuePerHop * decay * 0.28)),
      href: n.href,
      reason:
        distance === 1
          ? `Directly depends on ${origin.label}.`
          : `Reached through ${distance} dependency hops from ${origin.label}.`,
    });
  }

  // Within a layer, a journey outranks the steps that make it up: a reader
  // scanning "what breaks" wants the business outcome first, not hop order.
  const kindRank = (entity: ImpactedEntity) =>
    entity.kind === "journey" ? 0 : entity.kind === "journey-step" ? 1 : 2;
  entities.sort(
    (a, b) =>
      kindRank(a) - kindRank(b) ||
      a.distance - b.distance ||
      b.customersAffected - a.customersAffected,
  );

  const journeysAffected = entities.filter((e) => e.kind === "journey").map((e) => e.id);

  // Customers are a *union*, not a sum: the same person appears in Checkout and
  // in Make a Payment, and adding the audiences would exceed the active base.
  // The largest audience is taken whole and the rest contribute their
  // non-overlapping share, which is the same treatment the live window figure
  // gets in `narrative.ts`.
  const OVERLAP_SHARE = 0.28;
  const audiences = journeysAffected
    .map((id) => journeyById.get(id)?.customersInWindow ?? 0)
    .sort((a, b) => b - a);
  const union = audiences.reduce((sum, value, index) => sum + value * (index === 0 ? 1 : OVERLAP_SHARE), 0);
  const totalCustomers = Math.min(
    Math.round(union * 0.72 * Math.min(1, profile.severity / 3.4)),
    Math.round(WINDOW_IMPACT.customersActive * 0.92),
  );
  const transactionsFailed = Math.round(impactProfile.transactionsFailed * (profile.severity / 3.4));

  const { money, basis } = valueAtRisk({
    failedTransactions: transactionsFailed,
    averageOrderValue: WINDOW_IMPACT.averageOrderValue,
    currency: "USD",
    transactionEvidenceId: "ev-007",
    aovEvidenceId: "ev-009",
  });

  const paths: GraphPath[] = [];
  for (const journeyId of journeysAffected.slice(0, 3)) {
    const curated =
      journeyId === "jny-checkout" && originId.startsWith("db-payments")
        ? CURATED_PATHS_BY_ID.get("path-checkout-causal")
        : undefined;
    const path = curated ?? shortestPath(ds, journeyId, originId);
    if (path) paths.push(path);
  }

  return {
    originId,
    originLabel: origin.label,
    originKind: origin.kind,
    scenario,
    scenarioLabel: profile.label,
    generatedAt: T.now,
    entities,
    journeysAffected,
    businessServicesAffected: journeysAffected,
    impact: businessImpact({
      customersAffected: totalCustomers,
      customersActive: WINDOW_IMPACT.customersActive,
      transactionsFailed: 0,
      transactionsAtRisk: transactionsFailed,
      conversionImpactPct: -100 * Math.min(1, profile.severity / 3.4),
      from: T.now,
      to: T.now,
      estimated: money,
      basis: {
        ...basis,
        method: `${profile.label} scenario · ${basis.method}`,
        assumptions: [
          `Models a ${profile.label.toLowerCase()} of ${origin.label} sustained for one hour.`,
          "Affected customers are a union across journeys, not a sum: the largest audience is counted whole and the rest contribute their non-overlapping share.",
          "The dependency structure is trace-observed, so the set of affected entities is reliable. The customer and value figures scale current traffic into a hypothetical and are correspondingly uncertain.",
          ...basis.assumptions,
        ],
      },
      availability: {
        state: "partial",
        missing: ["observed loss"],
        note: "This is a forward-looking scenario, so no observed loss exists. Every figure here is modelled.",
      },
    }),
    paths,
    confidence: confidence(
      0.74,
      "The dependency structure is trace-observed, so the set of affected entities is reliable. The customer and value figures scale observed traffic to a hypothetical failure and are correspondingly uncertain.",
    ),
  };
}

export const BLAST_RADIUS_SCENARIOS = (
  Object.entries(SCENARIOS) as Array<[BlastRadius["scenario"], ScenarioProfile]>
).map(([scenario, p]) => ({ scenario, label: p.label, description: p.description }));

/** Entities worth offering as a starting point on the Impact screen. */
export const IMPACT_ORIGIN_SUGGESTIONS = [
  "db-payments-primary",
  "svc-payment-service",
  "svc-identity-token",
  "rtr-core-euc1",
  "db-orders-primary",
  "cache-session-store",
];
