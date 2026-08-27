import type { GraphEdge, GraphNode, GraphNodeKind, GraphSnapshot } from "@/types";
import { classPlural } from "@/lib/ontology/classes";
import { createRng } from "@/lib/utils/random";

/**
 * Radial "brain" layout.
 *
 * The layered map answers "how does impact travel" — business at the top,
 * infrastructure at the bottom. This answers a different question: "what does
 * the model know about, and how much of each?" The tenant sits at the centre,
 * every ontology class becomes a category ring, and each class's members fan
 * out behind it, so the shape of the estate is legible before a single label
 * is read.
 *
 * Like every layout here it is deterministic: the same snapshot always draws
 * the same brain, so the picture becomes something a user can remember.
 */
export interface BrainCategory {
  id: GraphNodeKind;
  label: string;
  count: number;
  x: number;
  y: number;
  /** Ring radius, sized by member count. */
  radius: number;
  /** Angle from the hub, radians. */
  angle: number;
  /** Distance from the hub. */
  distance: number;
  /** Outer edge of this category's fan, for label placement and hit-testing. */
  outerRadius: number;
  /** Worst health among the members — the category ring's own state. */
  health: GraphNode["health"];
}

export interface BrainEntity {
  node: GraphNode;
  categoryId: GraphNodeKind;
  x: number;
  y: number;
  radius: number;
}

export interface BrainLayout {
  hub: { x: number; y: number };
  categories: BrainCategory[];
  entities: BrainEntity[];
  entityById: Map<string, BrainEntity>;
  edges: GraphEdge[];
  width: number;
  height: number;
  /** Tight bounds around the drawn content, so the canvas is never letterboxed. */
  viewBox: string;
  totals: { entities: number; categories: number; relationships: number };
}

const SIZE = 1640;
const HUB_GAP = 198;
const RING_GAP = 34;
const FAN_OFFSET = 54;

const HEALTH_RANK: Record<GraphNode["health"], number> = {
  critical: 0,
  impaired: 1,
  degraded: 2,
  healthy: 3,
  unknown: 4,
};

export function layoutBrain(snapshot: GraphSnapshot): BrainLayout {
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const byKind = new Map<GraphNodeKind, GraphNode[]>();
  for (const node of snapshot.nodes) {
    const list = byKind.get(node.kind) ?? [];
    list.push(node);
    byKind.set(node.kind, list);
  }

  // Rank the categories deterministically, then *interleave* them around the
  // wheel — largest, smallest, second largest, second smallest. Walking the
  // ranking in order would pack every big cluster into one arc and leave the
  // opposite side a thin scatter of small rings.
  const ranked = [...byKind.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  const kinds: typeof ranked = [];
  for (let head = 0, tail = ranked.length - 1; head <= tail; head += 1, tail -= 1) {
    kinds.push(ranked[head]);
    if (head !== tail) kinds.push(ranked[tail]);
  }

  // Angular budget is proportional to the square root of the member count —
  // a category with 40 members needs more room than one with 4, but not ten
  // times more, or it would swallow the wheel.
  const totalWeight = kinds.reduce((sum, [, nodes]) => sum + Math.sqrt(nodes.length), 0);

  const categories: BrainCategory[] = [];
  const entities: BrainEntity[] = [];

  let cursor = -Math.PI / 2;

  for (const [kind, nodes] of kinds) {
    const rng = createRng(`brain:${kind}`);
    const slice = (Math.sqrt(nodes.length) / totalWeight) * Math.PI * 2;
    const angle = cursor + slice / 2;
    cursor += slice;

    // Varying the hub distance per category is what stops the wheel reading as
    // a mechanical daisy and gives it the organic depth of a real map.
    const distance = HUB_GAP + rng() * 86;
    const ringRadius = Math.min(11, 4 + Math.sqrt(nodes.length) * 1.5);

    const ordered = [...nodes].sort(
      (a, b) => HEALTH_RANK[a.health] - HEALTH_RANK[b.health] || a.label.localeCompare(b.label),
    );

    const perRing = Math.max(3, Math.ceil(Math.sqrt(ordered.length) * 1.7));
    const ringCount = Math.max(1, Math.ceil(ordered.length / perRing));

    ordered.forEach((node, index) => {
      const ring = Math.floor(index / perRing);
      const indexInRing = index % perRing;
      const inRing = Math.min(perRing, ordered.length - ring * perRing);
      const t = inRing === 1 ? 0.5 : indexInRing / (inRing - 1);
      const spread = slice * 0.88;
      const a = angle - spread / 2 + t * spread + (rng() - 0.5) * 0.04;
      const r = distance + FAN_OFFSET + ring * RING_GAP + (rng() - 0.5) * 16;

      entities.push({
        node,
        categoryId: kind,
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        radius: 2 + node.weight * 2.4,
      });
    });

    categories.push({
      id: kind,
      label: classPlural(kind),
      count: nodes.length,
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
      radius: ringRadius,
      angle,
      distance,
      outerRadius: distance + FAN_OFFSET + (ringCount - 1) * RING_GAP + 26,
      health: ordered[0]?.health ?? "unknown",
    });
  }

  // Fit the frame to what was actually drawn. A radial layout's extent depends
  // on the per-category distances, so a fixed canvas always leaves dead space.
  const xs = [...entities.map((e) => e.x), ...categories.map((c) => c.x), cx];
  const ys = [...entities.map((e) => e.y), ...categories.map((c) => c.y), cy];
  const pad = 46;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const boxW = Math.max(...xs) - minX + pad;
  const boxH = Math.max(...ys) - minY + pad;

  return {
    hub: { x: cx, y: cy },
    categories,
    entities,
    entityById: new Map(entities.map((e) => [e.node.id, e])),
    edges: snapshot.edges,
    width: boxW,
    height: boxH,
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${boxW.toFixed(1)} ${boxH.toFixed(1)}`,
    totals: {
      entities: snapshot.nodes.length,
      categories: categories.length,
      relationships: snapshot.edges.length,
    },
  };
}

export interface CategorySummary {
  id: GraphNodeKind;
  label: string;
  count: number;
  health: GraphNode["health"];
  /** Members that are degraded or worse — what makes a category worth opening. */
  unhealthy: number;
}

/**
 * Category counts without the geometry, for the legend panel and the
 * accessible reading of the diagram.
 */
export function categorySummary(snapshot: GraphSnapshot): CategorySummary[] {
  const byKind = new Map<GraphNodeKind, GraphNode[]>();
  for (const node of snapshot.nodes) {
    const list = byKind.get(node.kind) ?? [];
    list.push(node);
    byKind.set(node.kind, list);
  }

  return [...byKind.entries()]
    .map(([id, nodes]) => ({
      id,
      label: classPlural(id),
      count: nodes.length,
      health: [...nodes].sort((a, b) => HEALTH_RANK[a.health] - HEALTH_RANK[b.health])[0]?.health ?? "unknown",
      unhealthy: nodes.filter((n) => n.health !== "healthy" && n.health !== "unknown").length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
