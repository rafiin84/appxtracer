import type { GraphEdge, GraphLayer, GraphNode, GraphSnapshot } from "@/types";
import { LAYER_ORDER } from "@/lib/ontology/classes";

/**
 * Deterministic layered layout.
 *
 * A force simulation would produce a different picture on every render and a
 * hairball at any real scale. Instead nodes are banded by ontology layer —
 * business at the top, infrastructure at the bottom — and ordered within each
 * band by barycentre passes that pull each node toward the average position of
 * its neighbours, which is what removes most edge crossings.
 *
 * The result is stable: the same snapshot always produces the same picture, so
 * a user can build a spatial memory of their estate.
 */
export interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  radius: number;
  /** Index of the band this node sits in. */
  band: number;
}

export interface GraphLayout {
  nodes: LayoutNode[];
  nodesById: Map<string, LayoutNode>;
  edges: GraphEdge[];
  width: number;
  height: number;
  bands: Array<{ layer: GraphLayer; y: number; count: number }>;
}

const ROW_HEIGHT = 78;
const BAND_GAP = 52;
const MIN_GAP = 112;
const PADDING_X = 80;
const PADDING_Y = 66;

/**
 * Nodes per row inside a band.
 *
 * A single row per layer makes the picture unreadably wide as soon as a layer
 * holds more than a dozen entities, so bands wrap. The target is roughly a 3:2
 * canvas whatever the estate size.
 */
function nodesPerRow(total: number): number {
  return Math.min(16, Math.max(6, Math.ceil(Math.sqrt(total * 1.8))));
}

function nodeRadius(node: GraphNode): number {
  return 7 + node.weight * 9;
}

export function layoutGraph(snapshot: GraphSnapshot): GraphLayout {
  const layers = LAYER_ORDER.filter((layer) => snapshot.nodes.some((n) => n.layer === layer));

  const byLayer = new Map<GraphLayer, GraphNode[]>();
  for (const layer of layers) {
    byLayer.set(
      layer,
      snapshot.nodes
        .filter((n) => n.layer === layer)
        // A stable seed order: heaviest first, then alphabetical, so ties never
        // resolve differently between renders.
        .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label)),
    );
  }

  const order = new Map<string, number>();
  for (const layer of layers) {
    (byLayer.get(layer) ?? []).forEach((node, index) => order.set(node.id, index));
  }

  const neighbours = new Map<string, string[]>();
  for (const edge of snapshot.edges) {
    (neighbours.get(edge.from) ?? neighbours.set(edge.from, []).get(edge.from)!).push(edge.to);
    (neighbours.get(edge.to) ?? neighbours.set(edge.to, []).get(edge.to)!).push(edge.from);
  }

  // Barycentre passes, alternating sweep direction.
  for (let pass = 0; pass < 6; pass += 1) {
    const sweep = pass % 2 === 0 ? layers : [...layers].reverse();
    for (const layer of sweep) {
      const nodes = byLayer.get(layer) ?? [];
      const scored = nodes.map((node, index) => {
        const adjacency = neighbours.get(node.id) ?? [];
        const positions = adjacency
          .map((id) => order.get(id))
          .filter((v): v is number => v !== undefined);
        const barycentre = positions.length
          ? positions.reduce((sum, v) => sum + v, 0) / positions.length
          : index;
        return { node, barycentre, index };
      });
      scored.sort((a, b) => a.barycentre - b.barycentre || a.index - b.index);
      const reordered = scored.map((s) => s.node);
      byLayer.set(layer, reordered);
      reordered.forEach((node, index) => order.set(node.id, index));
    }
  }

  const perRow = nodesPerRow(snapshot.nodes.length);
  const widest = Math.min(
    perRow,
    Math.max(...layers.map((layer) => byLayer.get(layer)?.length ?? 0), 1),
  );
  const width = PADDING_X * 2 + Math.max(1, widest - 1) * MIN_GAP;

  const nodes: LayoutNode[] = [];
  const bands: GraphLayout["bands"] = [];

  let cursorY = PADDING_Y;
  layers.forEach((layer, bandIndex) => {
    const layerNodes = byLayer.get(layer) ?? [];
    bands.push({ layer, y: cursorY, count: layerNodes.length });

    const rowCount = Math.max(1, Math.ceil(layerNodes.length / perRow));
    for (let row = 0; row < rowCount; row += 1) {
      const rowNodes = layerNodes.slice(row * perRow, (row + 1) * perRow);
      const span = Math.max(1, rowNodes.length - 1) * MIN_GAP;
      const startX = (width - span) / 2;
      const y = cursorY + row * ROW_HEIGHT;

      rowNodes.forEach((node, index) => {
        nodes.push({
          ...node,
          x: rowNodes.length === 1 ? width / 2 : startX + index * MIN_GAP,
          // A gentle vertical stagger keeps long labels from colliding.
          y: y + (index % 2 === 0 ? 0 : 24),
          radius: nodeRadius(node),
          band: bandIndex,
        });
      });
    }

    cursorY += rowCount * ROW_HEIGHT + BAND_GAP;
  });

  const height = cursorY - BAND_GAP + PADDING_Y;

  return {
    nodes,
    nodesById: new Map(nodes.map((n) => [n.id, n])),
    edges: snapshot.edges,
    width,
    height,
    bands,
  };
}

/** Quadratic curve between two nodes, bowed away from the straight line. */
export function edgePath(from: LayoutNode, to: LayoutNode): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const bow = Math.min(38, distance * 0.14);
  const cx = mx - (dy / distance) * bow;
  const cy = my + (dx / distance) * bow;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}
