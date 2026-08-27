import type {
  GraphEdge,
  GraphFilter,
  GraphNode,
  GraphPath,
  GraphPredicate,
  GraphSnapshot,
  HealthState,
  TimeRangeKey,
} from "@/types";
import { IMPACT_PREDICATES, predicateLabel } from "@/lib/ontology/predicates";
import { graphDataset, type GraphDataset } from "@/lib/mock/graph-data";
import { CURATED_PATHS_BY_ID } from "@/lib/mock/paths";

/**
 * In-memory graph engine.
 *
 * This is the seam a production SPARQL service replaces. Every exported
 * function here corresponds to one of the query templates in
 * `lib/ontology/sparql.ts`; components call these, never the dataset directly,
 * so swapping the transport is a change to this file alone.
 */

export function dataset(rangeKey: TimeRangeKey): GraphDataset {
  return graphDataset(rangeKey);
}

const UNHEALTHY: HealthState[] = ["degraded", "impaired", "critical"];

function matches(node: GraphNode, filter: GraphFilter): boolean {
  if (filter.kinds?.length && !filter.kinds.includes(node.kind)) return false;
  if (filter.layers?.length && !filter.layers.includes(node.layer)) return false;
  if (filter.health?.length && !filter.health.includes(node.health)) return false;
  if (filter.impactedOnly && !UNHEALTHY.includes(node.health)) return false;
  if (filter.regions?.length && node.region && !filter.regions.includes(node.region)) return false;
  if (filter.query) {
    const q = filter.query.toLowerCase();
    if (!node.label.toLowerCase().includes(q) && !node.id.toLowerCase().includes(q)) return false;
  }
  return true;
}

/**
 * Bounded traversal around a focus node, following edges in both directions.
 * Depth is capped because an unbounded neighbourhood of a shared database is
 * the entire estate — a "spaghetti graph" and useless to look at.
 */
export function neighbourhood(
  ds: GraphDataset,
  focusId: string,
  depth: number,
): { nodeIds: Set<string>; edges: GraphEdge[] } {
  const nodeIds = new Set<string>([focusId]);
  const edges: GraphEdge[] = [];
  let frontier = [focusId];

  for (let d = 0; d < Math.max(1, Math.min(depth, 4)); d += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of [...(ds.out.get(id) ?? []), ...(ds.in.get(id) ?? [])]) {
        edges.push(e);
        const other = e.from === id ? e.to : e.from;
        if (!nodeIds.has(other)) {
          nodeIds.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }

  return { nodeIds, edges };
}

const MAX_RENDERED_NODES = 260;

export function query(rangeKey: TimeRangeKey, filter: GraphFilter): {
  snapshot: GraphSnapshot;
  truncated: boolean;
} {
  const ds = dataset(rangeKey);
  let nodes = ds.snapshot.nodes;
  let edges = ds.snapshot.edges;

  if (filter.focusId && ds.nodesById.has(filter.focusId)) {
    const { nodeIds, edges: localEdges } = neighbourhood(ds, filter.focusId, filter.depth ?? 2);
    nodes = nodes.filter((n) => nodeIds.has(n.id));
    const edgeIds = new Set(localEdges.map((e) => e.id));
    edges = edges.filter((e) => edgeIds.has(e.id));
  }

  // The focus node always survives its own filters, so focusing never blanks
  // the view.
  nodes = nodes.filter((n) => n.id === filter.focusId || matches(n, filter));

  const keep = new Set(nodes.map((n) => n.id));
  edges = edges.filter((e) => keep.has(e.from) && keep.has(e.to));

  const truncated = nodes.length > MAX_RENDERED_NODES;
  if (truncated) {
    // Keep the heaviest and least healthy nodes — the ones worth looking at.
    const rank = (n: GraphNode) => n.weight + (UNHEALTHY.includes(n.health) ? 1 : 0);
    nodes = [...nodes].sort((a, b) => rank(b) - rank(a)).slice(0, MAX_RENDERED_NODES);
    const kept = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => kept.has(e.from) && kept.has(e.to));
  }

  return {
    snapshot: {
      nodes,
      edges,
      generatedAt: ds.snapshot.generatedAt,
      totals: ds.snapshot.totals,
    },
    truncated,
  };
}

/** Breadth-first shortest path, restricted to a predicate set. */
export function shortestPath(
  ds: GraphDataset,
  fromId: string,
  toId: string,
  predicates: GraphPredicate[] = IMPACT_PREDICATES,
): GraphPath | undefined {
  if (fromId === toId) return undefined;
  const allowed = new Set(predicates);
  const previous = new Map<string, { node: string; edge: GraphEdge }>();
  const visited = new Set([fromId]);
  const queue = [fromId];

  while (queue.length) {
    const current = queue.shift() as string;
    for (const e of ds.out.get(current) ?? []) {
      if (!allowed.has(e.predicate)) continue;
      if (visited.has(e.to)) continue;
      visited.add(e.to);
      previous.set(e.to, { node: current, edge: e });
      if (e.to === toId) {
        return reconstruct(ds, fromId, toId, previous);
      }
      queue.push(e.to);
    }
  }
  return undefined;
}

function reconstruct(
  ds: GraphDataset,
  fromId: string,
  toId: string,
  previous: Map<string, { node: string; edge: GraphEdge }>,
): GraphPath {
  const nodeIds: string[] = [toId];
  const edges: GraphEdge[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = previous.get(cursor);
    if (!step) break;
    edges.unshift(step.edge);
    nodeIds.unshift(step.node);
    cursor = step.node;
  }
  const evidenceIds = [...new Set(edges.flatMap((e) => e.evidenceIds ?? []))];
  return {
    id: `path-${fromId}-${toId}`,
    kind: "dependency",
    label: `${ds.nodesById.get(fromId)?.label ?? fromId} → ${ds.nodesById.get(toId)?.label ?? toId}`,
    nodeIds,
    edgeIds: edges.map((e) => e.id),
    narration: edges.map((e) => {
      const from = ds.nodesById.get(e.from)?.label ?? e.from;
      const to = ds.nodesById.get(e.to)?.label ?? e.to;
      return `${from} ${predicateLabel(e.predicate)} ${to}.`;
    }),
    evidenceIds,
  };
}

export function curatedPath(id: string): GraphPath | undefined {
  return CURATED_PATHS_BY_ID.get(id);
}

/**
 * Inverse traversal: everything that would be affected if the origin failed.
 * Returns hop distance per entity, which is what the impact view sorts on.
 */
export function reachedByFailure(
  ds: GraphDataset,
  originId: string,
  maxDepth = 4,
): Map<string, number> {
  const distances = new Map<string, number>([[originId, 0]]);
  let frontier = [originId];

  for (let d = 1; d <= maxDepth; d += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of ds.in.get(id) ?? []) {
        // Only dependency-bearing predicates propagate failure upward.
        if (!IMPACT_PREDICATES.includes(e.predicate)) continue;
        if (distances.has(e.from)) continue;
        distances.set(e.from, d);
        next.push(e.from);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }

  return distances;
}

/** Nodes matching a free-text query, ranked by weight then label length. */
export function search(rangeKey: TimeRangeKey, term: string, limit = 12): GraphNode[] {
  const ds = dataset(rangeKey);
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return ds.snapshot.nodes
    .filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    .sort((a, b) => b.weight - a.weight || a.label.length - b.label.length)
    .slice(0, limit);
}
