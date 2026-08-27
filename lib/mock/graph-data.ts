import type {
  Application,
  GraphEdge,
  GraphNode,
  GraphNodeKind,
  GraphPredicate,
  GraphSnapshot,
  HealthState,
  Service,
  TimeRangeKey,
} from "@/types";
import { layerOf } from "@/lib/ontology/classes";
import { formatLatency, formatPercent, formatNumber } from "@/lib/formatters";
import { buildApplications } from "./applications";
import { buildJourneys } from "./journeys";
import { buildServices } from "./services";
import { INFRASTRUCTURE } from "./infrastructure";
import { INCIDENTS } from "./incidents";
import { CHANGES } from "./changes";
import { CUSTOMERS } from "./customers";
import { T } from "./narrative";

/**
 * The semantic graph.
 *
 * Nodes and edges are *derived* from the entity data rather than authored
 * separately, which is what keeps the map consistent with every other screen:
 * if Payment Service depends on the payments database in `services.ts`, that
 * edge exists in the graph, in the blast radius and in the causal path, with no
 * second source of truth to drift.
 */

const CRITICALITY_WEIGHT: Record<string, number> = {
  "mission-critical": 1,
  "business-critical": 0.78,
  important: 0.55,
  standard: 0.35,
};

function serviceKindToNodeKind(kind: Service["kind"]): GraphNodeKind {
  switch (kind) {
    case "api":
      return "api";
    case "database":
      return "database";
    case "queue":
      return "queue";
    case "cache":
      return "cache";
    case "cdn":
      return "cdn";
    case "third-party":
      return "third-party";
    default:
      return "service";
  }
}

function applicationKindToNodeKind(app: Application): GraphNodeKind {
  return app.kind === "api" ? "api" : "application";
}

function node(input: {
  id: string;
  label: string;
  kind: GraphNodeKind;
  health: HealthState;
  weight: number;
  region?: GraphNode["region"];
  href?: string;
  facts: GraphNode["facts"];
  inferred?: boolean;
  incidentIds?: string[];
  changeIds?: string[];
  evidenceIds?: string[];
}): GraphNode {
  return { ...input, layer: layerOf(input.kind) };
}

function edge(
  from: string,
  to: string,
  predicate: GraphPredicate,
  label: string,
  options: Partial<Omit<GraphEdge, "id" | "from" | "to" | "predicate" | "label">> = {},
): GraphEdge {
  return {
    id: `${from}--${predicate}--${to}`,
    from,
    to,
    predicate,
    label,
    provenance: options.provenance ?? "observed",
    confidence: options.confidence,
    health: options.health,
    weight: options.weight,
    evidenceIds: options.evidenceIds,
    assertedAt: options.assertedAt,
    source: options.source,
  };
}

export interface GraphDataset {
  snapshot: GraphSnapshot;
  nodesById: Map<string, GraphNode>;
  /** Outgoing adjacency, for downstream traversal. */
  out: Map<string, GraphEdge[]>;
  /** Incoming adjacency, for blast-radius (inverse) traversal. */
  in: Map<string, GraphEdge[]>;
}

function infraPredicate(kind: GraphNodeKind): GraphPredicate {
  switch (kind) {
    case "kubernetes-cluster":
    case "container":
    case "vm":
    case "server":
      return "deployedOn";
    case "network-device":
    case "interface":
    case "load-balancer":
      return "routesThrough";
    case "firewall":
    case "security-control":
      return "protectedBy";
    default:
      return "runsIn";
  }
}

function buildGraph(rangeKey: TimeRangeKey): GraphDataset {
  const journeys = buildJourneys(rangeKey);
  const applications = buildApplications(rangeKey);
  const services = buildServices(rangeKey);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  const push = (e: GraphEdge) => {
    if (seenEdges.has(e.id)) return;
    seenEdges.add(e.id);
    edges.push(e);
  };

  const appById = new Map(applications.map((a) => [a.id, a]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const infraById = new Map(INFRASTRUCTURE.map((i) => [i.id, i]));

  const nodeKindOf = (id: string): GraphNodeKind | undefined => {
    const app = appById.get(id);
    if (app) return applicationKindToNodeKind(app);
    const svc = serviceById.get(id);
    if (svc) return serviceKindToNodeKind(svc.kind);
    const infra = infraById.get(id);
    if (infra) return infra.kind;
    return undefined;
  };

  // ---- Journeys and steps --------------------------------------------------
  for (const j of journeys) {
    nodes.push(
      node({
        id: j.id,
        label: j.name,
        kind: "journey",
        health: j.health,
        weight: CRITICALITY_WEIGHT[j.criticality] ?? 0.5,
        href: `/journeys/${j.id}`,
        facts: [
          { label: "Criticality", value: j.criticality.replace("-", " ") },
          { label: "Success rate", value: formatPercent(j.successRatePct) },
          { label: "Customers affected", value: formatNumber(j.customersAffected) },
          { label: "Owner", value: j.owner?.team ?? "Unassigned" },
        ],
        incidentIds: j.incidentIds,
        changeIds: j.changeIds,
      }),
    );

    for (const step of j.steps) {
      nodes.push(
        node({
          id: step.id,
          label: step.name,
          kind: "journey-step",
          health: step.health,
          weight: 0.4,
          href: `/journeys/${j.id}`,
          facts: [
            { label: "Success rate", value: formatPercent(step.successRatePct) },
            { label: "p95", value: formatLatency(step.p95LatencyMs) },
            { label: "Drop-off", value: formatPercent(step.dropOffPct) },
          ],
        }),
      );
      push(edge(j.id, step.id, "hasStep", `step ${step.order + 1}`, { health: step.health }));
      for (const appId of step.applicationIds) {
        push(
          edge(step.id, appId, "servedBy", "served by", {
            provenance: "derived",
            health: appById.get(appId)?.health,
            source: "OpenTelemetry",
            evidenceIds: ["ev-011", "ev-051"],
          }),
        );
      }
    }
  }

  // ---- Applications --------------------------------------------------------
  for (const a of applications) {
    nodes.push(
      node({
        id: a.id,
        label: a.name,
        kind: applicationKindToNodeKind(a),
        health: a.health,
        weight: CRITICALITY_WEIGHT[a.criticality] ?? 0.5,
        href: `/applications/${a.id}`,
        facts: [
          { label: "p95", value: formatLatency(a.p95LatencyMs) },
          { label: "Error rate", value: formatPercent(a.errorRatePct) },
          { label: "Availability", value: formatPercent(a.availabilityPct, 2) },
          { label: "Owner", value: a.owner.team },
        ],
        incidentIds: a.incidentIds,
        changeIds: a.changeIds,
      }),
    );

    for (const depId of a.dependencyIds) {
      const kind = nodeKindOf(depId);
      if (!kind) continue;
      push(
        edge(a.id, depId, kind === "api" || kind === "application" ? "dependsOn" : "calls", "calls", {
          health: serviceById.get(depId)?.health ?? appById.get(depId)?.health,
          weight: 0.8,
          evidenceIds: depId === "svc-payment-service" ? ["ev-011"] : undefined,
        }),
      );
    }
  }

  // ---- Services ------------------------------------------------------------
  for (const s of services) {
    nodes.push(
      node({
        id: s.id,
        label: s.name,
        kind: serviceKindToNodeKind(s.kind),
        health: s.health,
        weight: s.kind === "database" || s.kind === "queue" ? 0.8 : 0.6,
        href: s.applicationId ? `/applications/${s.applicationId}` : undefined,
        facts: [
          { label: "p95", value: formatLatency(s.p95LatencyMs) },
          { label: "Error rate", value: formatPercent(s.errorRatePct) },
          ...(s.saturationPct !== undefined
            ? [{ label: "Saturation", value: formatPercent(s.saturationPct, 0) }]
            : []),
          ...(s.vendor ? [{ label: "Vendor", value: s.vendor }] : []),
        ],
        incidentIds: s.incidentIds,
        changeIds: s.changeIds,
      }),
    );

    for (const depId of s.dependencyIds) {
      const kind = nodeKindOf(depId);
      const predicate: GraphPredicate =
        kind === "database" ? "persistsTo" : kind === "queue" ? "publishesTo" : kind === "cache" ? "cachedBy" : "dependsOn";
      push(
        edge(s.id, depId, predicate, predicate === "dependsOn" ? "depends on" : predicate.replace(/([A-Z])/g, " $1").toLowerCase(), {
          health: serviceById.get(depId)?.health,
          weight: 0.7,
          evidenceIds:
            s.id === "svc-payment-service" && depId === "db-payments-primary" ? ["ev-033"] : undefined,
        }),
      );
    }

    for (const infraId of s.infrastructureIds) {
      const infra = infraById.get(infraId);
      if (!infra) continue;
      push(
        edge(s.id, infraId, infraPredicate(infra.kind), "runs on", {
          health: infra.health,
          weight: 0.5,
          evidenceIds: infraId === "fw-payments-dmz" ? ["ev-035"] : undefined,
        }),
      );
    }
  }

  // ---- Infrastructure ------------------------------------------------------
  for (const i of INFRASTRUCTURE) {
    nodes.push(
      node({
        id: i.id,
        label: i.name,
        kind: i.kind,
        health: i.health,
        weight: i.kind === "cloud-resource" ? 0.7 : 0.45,
        region: i.region,
        facts: [
          { label: "Provider", value: i.provider.toUpperCase() },
          ...(i.zone ? [{ label: "Zone", value: i.zone }] : []),
          ...(i.attributes.connectionPoolUtilPct !== undefined
            ? [{ label: "Pool utilisation", value: formatPercent(i.attributes.connectionPoolUtilPct, 0) }]
            : []),
          ...(i.attributes.cpuUtilPct !== undefined
            ? [{ label: "CPU", value: formatPercent(i.attributes.cpuUtilPct, 0) }]
            : []),
          ...(i.attributes.packetLossPct !== undefined
            ? [{ label: "Packet loss", value: formatPercent(i.attributes.packetLossPct, 2) }]
            : []),
          { label: "Owner", value: i.owner.team },
        ],
        incidentIds: i.incidentIds,
        changeIds: i.changeIds,
      }),
    );

    for (const depId of i.dependencyIds) {
      const dep = infraById.get(depId);
      if (!dep) continue;
      const predicate: GraphPredicate =
        dep.kind === "cloud-resource" ? "runsIn" : dep.kind === "interface" || dep.kind === "network-device" ? "connectedTo" : "hostedOn";
      push(edge(i.id, depId, predicate, predicate === "runsIn" ? "runs in" : predicate === "connectedTo" ? "connected to" : "hosted on", { health: dep.health, weight: 0.4 }));
    }
  }

  // ---- Operations ----------------------------------------------------------
  for (const inc of INCIDENTS) {
    nodes.push(
      node({
        id: inc.id,
        label: inc.reference,
        kind: "incident",
        health: inc.state === "resolved" ? "healthy" : inc.severity === "sev1" ? "critical" : "impaired",
        weight: inc.severity === "sev1" ? 0.95 : inc.severity === "sev2" ? 0.7 : 0.5,
        href: `/incidents/${inc.id}`,
        facts: [
          { label: "Severity", value: inc.severity.toUpperCase() },
          { label: "State", value: inc.state },
          { label: "Customers affected", value: formatNumber(inc.customersAffected) },
        ],
        evidenceIds: inc.evidenceIds,
      }),
    );
    const affected = [
      ...inc.journeyIds,
      ...inc.applicationIds,
      ...inc.serviceIds,
      ...inc.infrastructureIds,
    ];
    for (const targetId of affected) {
      push(
        edge(inc.id, targetId, "affects", "affects", {
          provenance: "derived",
          health: inc.state === "resolved" ? "healthy" : "impaired",
          evidenceIds: inc.evidenceIds.slice(0, 3),
        }),
      );
    }
    if (inc.rootCauseId) {
      // The causal attribution is an edge in its own right, always derived.
      const cause = inc.serviceIds[0] ?? inc.applicationIds[0];
      if (cause) {
        push(
          edge(inc.id, cause, "causedBy", "caused by", {
            provenance: "derived",
            evidenceIds: inc.evidenceIds.slice(0, 4),
          }),
        );
      }
    }
  }

  for (const c of CHANGES) {
    nodes.push(
      node({
        id: c.id,
        label: c.reference,
        kind: "change",
        health: c.correlation ? "impaired" : "healthy",
        weight: c.risk === "high" ? 0.7 : c.risk === "medium" ? 0.5 : 0.35,
        href: `/changes/${c.id}`,
        facts: [
          { label: "Kind", value: c.kind.replace("-", " ") },
          { label: "Team", value: c.actorTeam },
          { label: "Risk", value: c.risk },
          ...(c.rolledBack ? [{ label: "Rolled back", value: "Yes" }] : []),
        ],
        evidenceIds: c.evidenceIds,
      }),
    );
    for (const targetId of [...c.targetIds, ...c.applicationIds, ...c.serviceIds, ...c.infrastructureIds]) {
      push(edge(targetId, c.id, "changedBy", "changed by", { assertedAt: c.at, source: c.source }));
    }
    if (c.correlation?.incidentId) {
      push(
        edge(c.id, c.correlation.incidentId, "correlatesWith", "correlates with", {
          provenance: "derived",
          confidence: c.correlation.confidence,
          evidenceIds: c.evidenceIds,
        }),
      );
    }
  }

  // ---- Customers (a representative sample, not the full 41.6M) -------------
  for (const cust of CUSTOMERS.slice(0, 6)) {
    nodes.push(
      node({
        id: cust.id,
        label: cust.displayName,
        kind: "customer",
        health: cust.currentHealth,
        weight: 0.3,
        region: cust.region,
        href: `/customers/${cust.id}`,
        facts: [
          { label: "Tier", value: cust.tier },
          { label: "Region", value: cust.region },
          { label: "Experience score", value: String(cust.experienceScore) },
        ],
      }),
    );
    push(edge(cust.id, "jny-checkout", "engagesIn", "engages in", { health: cust.currentHealth, assertedAt: T.now }));
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  // Drop edges whose endpoints were never materialised, so the graph is closed.
  const closed = edges.filter((e) => nodesById.has(e.from) && nodesById.has(e.to));

  const out = new Map<string, GraphEdge[]>();
  const inc = new Map<string, GraphEdge[]>();
  for (const e of closed) {
    (out.get(e.from) ?? out.set(e.from, []).get(e.from)!).push(e);
    (inc.get(e.to) ?? inc.set(e.to, []).get(e.to)!).push(e);
  }

  return {
    snapshot: {
      nodes,
      edges: closed,
      generatedAt: T.now,
      totals: { nodes: nodes.length, edges: closed.length },
    },
    nodesById,
    out,
    in: inc,
  };
}

const cache = new Map<TimeRangeKey, GraphDataset>();

export function graphDataset(rangeKey: TimeRangeKey): GraphDataset {
  const existing = cache.get(rangeKey);
  if (existing) return existing;
  const built = buildGraph(rangeKey);
  cache.set(rangeKey, built);
  return built;
}
