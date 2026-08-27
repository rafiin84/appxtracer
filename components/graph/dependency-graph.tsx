"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { GraphPath, GraphSnapshot } from "@/types";
import { edgePath, layoutGraph, type LayoutNode } from "@/lib/graph/layout";
import { LAYER_LABEL } from "@/lib/ontology/classes";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

const HEALTH_FILL = {
  healthy: "var(--good)",
  degraded: "var(--warning)",
  impaired: "var(--serious)",
  critical: "var(--critical)",
  unknown: "var(--ink-muted)",
} as const;

/**
 * The digital map.
 *
 * Layered by ontology layer and laid out deterministically, so the picture is
 * the same every time and a reader can build spatial memory. Everything that
 * would turn it into a hairball is deliberately constrained: bounded traversal
 * depth, a node cap, and dimming rather than hiding when a path is highlighted.
 */
export function DependencyGraph({
  snapshot,
  highlightedPath,
  selectedId,
  onSelectNode,
  onSelectEdge,
  className,
  height = 560,
}: {
  snapshot: GraphSnapshot;
  highlightedPath?: GraphPath;
  selectedId?: string;
  onSelectNode?: (id: string) => void;
  onSelectEdge?: (id: string) => void;
  className?: string;
  height?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const layout = React.useMemo(() => layoutGraph(snapshot), [snapshot]);
  // Below this many nodes every label fits; above it, only the heavy ones do.
  const labelAll = layout.nodes.length <= 70;
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragState = React.useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const pathNodeIds = React.useMemo(
    () => new Set(highlightedPath?.nodeIds ?? []),
    [highlightedPath],
  );
  const pathEdgeIds = React.useMemo(
    () => new Set(highlightedPath?.edgeIds ?? []),
    [highlightedPath],
  );

  // Neighbours of the *hovered* node, for local emphasis. Selection deliberately
  // does not dim: a selected node stays visible in its context rather than
  // blanking the rest of the estate while the inspector is open.
  const connected = React.useMemo(() => {
    const focusId = hovered;
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const edge of layout.edges) {
      if (edge.from === focusId) set.add(edge.to);
      if (edge.to === focusId) set.add(edge.from);
    }
    return set;
  }, [hovered, layout.edges]);

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    setPan({
      x: dragState.current.panX + (event.clientX - dragState.current.x),
      y: dragState.current.panY + (event.clientY - dragState.current.y),
    });
  };

  const endDrag = () => {
    dragState.current = null;
  };

  return (
    <div className={cn("relative overflow-hidden rounded-panel bg-surface-sunken", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        role="img"
        aria-label={`Dependency graph with ${layout.nodes.length} entities and ${layout.edges.length} relationships, grouped into ${layout.bands.length} layers.`}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {/* Layer bands. */}
          {layout.bands.map((band) => (
            <g key={band.layer}>
              <line
                x1={0}
                x2={layout.width}
                y1={band.y - 34}
                y2={band.y - 34}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={14}
                y={band.y - 40}
                className="fill-[var(--ink-muted)]"
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
              >
                {LAYER_LABEL[band.layer].toUpperCase()} · {band.count}
              </text>
            </g>
          ))}

          {/* Edges. */}
          {layout.edges.map((edge) => {
            const from = layout.nodesById.get(edge.from);
            const to = layout.nodesById.get(edge.to);
            if (!from || !to) return null;

            const onPath = pathEdgeIds.has(edge.id);
            const nearFocus =
              !connected || (connected.has(edge.from) && connected.has(edge.to));
            const dimmed = (highlightedPath && !onPath) || (Boolean(connected) && !nearFocus);

            return (
              <g key={edge.id}>
                <path
                  d={edgePath(from, to)}
                  fill="none"
                  stroke={onPath ? "var(--critical)" : "var(--axis)"}
                  strokeWidth={onPath ? 2.4 : 1.1}
                  strokeLinecap="round"
                  opacity={dimmed ? 0.12 : onPath ? 1 : 0.5}
                  strokeDasharray={edge.provenance === "derived" ? "4 3" : undefined}
                />
                {onSelectEdge && (
                  <path
                    d={edgePath(from, to)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={12}
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectEdge(edge.id);
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes. */}
          {layout.nodes.map((node) => (
            <GraphNodeMark
              key={node.id}
              node={node}
              selected={node.id === selectedId}
              onPath={pathNodeIds.has(node.id)}
              dimmed={
                (Boolean(highlightedPath) && !pathNodeIds.has(node.id)) ||
                (Boolean(connected) && !connected?.has(node.id))
              }
              reduced={reduced}
              labelAll={labelAll}
              onHover={setHovered}
              onSelect={onSelectNode}
            />
          ))}
        </g>
      </svg>

      <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col gap-1 rounded-lg bg-surface p-1 shadow-sm ring-hairline">
        {[
          { label: "Zoom in", symbol: "+", action: () => setZoom((z) => Math.min(2.4, z + 0.2)) },
          { label: "Zoom out", symbol: "−", action: () => setZoom((z) => Math.max(0.45, z - 0.2)) },
          {
            label: "Reset view",
            symbol: "⌂",
            action: () => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            },
          },
        ].map((control) => (
          <button
            key={control.label}
            type="button"
            onClick={control.action}
            aria-label={control.label}
            className="grid size-7 place-items-center rounded-md text-[14px] text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            {control.symbol}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface/90 px-2.5 py-1.5 text-[11px] text-ink-secondary shadow-sm ring-hairline backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-[var(--axis)]" aria-hidden />
          Observed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--axis) 0 4px, transparent 4px 7px)" }}
            aria-hidden
          />
          Inferred
        </span>
        {highlightedPath && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-critical" aria-hidden />
            Highlighted path
          </span>
        )}
      </div>
    </div>
  );
}

function GraphNodeMark({
  node,
  selected,
  onPath,
  dimmed,
  reduced,
  labelAll,
  onHover,
  onSelect,
}: {
  node: LayoutNode;
  selected: boolean;
  onPath: boolean;
  dimmed: boolean;
  reduced: boolean;
  labelAll: boolean;
  onHover: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const fill = HEALTH_FILL[node.health];
  const showLabel = labelAll || node.weight > 0.62 || selected || onPath;

  return (
    <g
      opacity={dimmed ? 0.22 : 1}
      className={cn(onSelect && "cursor-pointer")}
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(node.id);
      }}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={`${node.label}, ${node.health}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(node.id);
        }
      }}
    >
      {(onPath || selected) && !reduced && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={node.radius}
          fill={onPath ? "var(--critical)" : "var(--accent)"}
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: [0.35, 0, 0.35], scale: [1, 2.1, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        />
      )}

      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill={fill}
        stroke="var(--surface-sunken)"
        strokeWidth={2}
      />
      {(selected || onPath) && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.radius + 4}
          fill="none"
          stroke={onPath ? "var(--critical)" : "var(--accent)"}
          strokeWidth={2}
        />
      )}

      {showLabel && (
        <text
          x={node.x}
          y={node.y + node.radius + 13}
          textAnchor="middle"
          className="pointer-events-none fill-[var(--ink-secondary)]"
          style={{ fontSize: 10.5, fontWeight: 500 }}
        >
          {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
        </text>
      )}
    </g>
  );
}
