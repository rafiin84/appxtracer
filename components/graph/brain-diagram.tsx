"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { GraphNodeKind, GraphPath, GraphSnapshot } from "@/types";
import { layoutBrain } from "@/lib/graph/brain-layout";
import { COMPANY } from "@/lib/mock/company";
import { classLabel } from "@/lib/ontology/classes";
import { formatNumber } from "@/lib/formatters";
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
 * The brain diagram.
 *
 * Every entity APPX Tracer knows about, on one canvas: the tenant at the
 * centre, one ring per ontology class, and each class's members fanning out
 * behind it. It is a shape-of-the-estate view rather than an impact view — you
 * read the size of the clusters and where the unhealthy colour concentrates
 * before you read a single label.
 */
export function BrainDiagram({
  snapshot,
  highlightedPath,
  selectedId,
  highlightedCategory,
  showRelationships,
  onSelectNode,
  onSelectCategory,
  className,
  height = 620,
}: {
  snapshot: GraphSnapshot;
  highlightedPath?: GraphPath;
  selectedId?: string;
  highlightedCategory?: GraphNodeKind;
  showRelationships?: boolean;
  onSelectNode?: (id: string) => void;
  onSelectCategory?: (kind: GraphNodeKind) => void;
  className?: string;
  height?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const layout = React.useMemo(() => layoutBrain(snapshot), [snapshot]);
  const [hovered, setHovered] = React.useState<
    { label: string; sublabel: string; x: number; y: number } | null
  >(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const drag = React.useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const pathNodeIds = React.useMemo(
    () => new Set(highlightedPath?.nodeIds ?? []),
    [highlightedPath],
  );
  const pathEdgeIds = React.useMemo(
    () => new Set(highlightedPath?.edgeIds ?? []),
    [highlightedPath],
  );

  const dimmed = (kind: GraphNodeKind, id?: string) => {
    if (highlightedPath && id) return !pathNodeIds.has(id);
    if (highlightedCategory) return kind !== highlightedCategory;
    return false;
  };

  return (
    <div
      className={cn("relative overflow-hidden rounded-panel bg-surface-sunken", className)}
      style={{ height }}
    >
      <svg
        viewBox={layout.viewBox}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setPan({
            x: drag.current.panX + (event.clientX - drag.current.x),
            y: drag.current.panY + (event.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
          setHovered(null);
        }}
        role="img"
        aria-label={`Brain diagram of ${formatNumber(layout.totals.entities)} entities across ${layout.totals.categories} categories, centred on ${COMPANY.name}.`}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {/* Spokes: hub to each category. */}
          {layout.categories.map((category) => (
            <line
              key={`spoke-${category.id}`}
              x1={layout.hub.x}
              y1={layout.hub.y}
              x2={category.x}
              y2={category.y}
              stroke="var(--axis)"
              strokeWidth={0.9}
              opacity={dimmed(category.id) ? 0.08 : 0.42}
            />
          ))}

          {/* Filaments: category to each of its members. */}
          {layout.entities.map((entity) => {
            const category = layout.categories.find((c) => c.id === entity.categoryId);
            if (!category) return null;
            return (
              <line
                key={`filament-${entity.node.id}`}
                x1={category.x}
                y1={category.y}
                x2={entity.x}
                y2={entity.y}
                stroke="var(--axis)"
                strokeWidth={0.6}
                opacity={dimmed(entity.categoryId, entity.node.id) ? 0.05 : 0.3}
              />
            );
          })}

          {/* The real relationships, off by default — this is the difference
              between a category tree and a graph. All 436 at once is a web, so
              highlighting a category narrows the overlay to its own edges,
              which is where it stops being decoration and starts answering a
              question. */}
          {showRelationships &&
            layout.edges.map((edge) => {
              const from = layout.entityById.get(edge.from);
              const to = layout.entityById.get(edge.to);
              if (!from || !to) return null;
              const onPath = pathEdgeIds.has(edge.id);
              const touchesCategory =
                !highlightedCategory ||
                from.categoryId === highlightedCategory ||
                to.categoryId === highlightedCategory;
              if (!touchesCategory && !onPath) return null;
              const emphasised = onPath || Boolean(highlightedCategory);
              return (
                <line
                  key={`rel-${edge.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={onPath ? "var(--critical)" : "var(--accent)"}
                  strokeWidth={onPath ? 1.6 : emphasised ? 0.9 : 0.5}
                  opacity={onPath ? 0.9 : emphasised ? 0.5 : 0.1}
                />
              );
            })}

          {/* Members. */}
          {layout.entities.map((entity) => {
            const isDim = dimmed(entity.categoryId, entity.node.id);
            const onPath = pathNodeIds.has(entity.node.id);
            const isSelected = entity.node.id === selectedId;
            return (
              <g key={entity.node.id}>
                {(onPath || isSelected) && !reduced && (
                  <motion.circle
                    cx={entity.x}
                    cy={entity.y}
                    r={entity.radius + 2}
                    fill={onPath ? "var(--critical)" : "var(--accent)"}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 0, 0.4], scale: [1, 2.6, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                    style={{ transformOrigin: `${entity.x}px ${entity.y}px` }}
                  />
                )}
                <circle
                  cx={entity.x}
                  cy={entity.y}
                  r={entity.radius}
                  fill={HEALTH_FILL[entity.node.health]}
                  opacity={isDim ? 0.16 : 1}
                />
                {(isSelected || onPath) && (
                  <circle
                    cx={entity.x}
                    cy={entity.y}
                    r={entity.radius + 3.5}
                    fill="none"
                    stroke={onPath ? "var(--critical)" : "var(--accent)"}
                    strokeWidth={1.4}
                  />
                )}
                {/* A hit target far larger than the dot — 3px marks are
                    impossible to click accurately otherwise. */}
                <circle
                  cx={entity.x}
                  cy={entity.y}
                  r={10}
                  fill="transparent"
                  className={onSelectNode ? "cursor-pointer" : undefined}
                  onPointerEnter={() =>
                    setHovered({
                      label: entity.node.label,
                      sublabel: `${classLabel(entity.node.kind)} · ${entity.node.health}`,
                      x: entity.x,
                      y: entity.y,
                    })
                  }
                  onPointerLeave={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectNode?.(entity.node.id);
                  }}
                />
              </g>
            );
          })}

          {/* Category rings. */}
          {layout.categories.map((category) => {
            const isDim = dimmed(category.id);
            return (
              <g key={category.id}>
                <circle
                  cx={category.x}
                  cy={category.y}
                  r={category.radius}
                  fill="var(--surface-sunken)"
                  stroke={
                    highlightedCategory === category.id ? "var(--accent)" : "var(--tenant)"
                  }
                  strokeWidth={highlightedCategory === category.id ? 2.4 : 1.6}
                  opacity={isDim ? 0.2 : 1}
                />
                <circle
                  cx={category.x}
                  cy={category.y}
                  r={category.radius + 8}
                  fill="transparent"
                  className={onSelectCategory ? "cursor-pointer" : undefined}
                  onPointerEnter={() =>
                    setHovered({
                      label: category.label,
                      sublabel: `${category.count} ${category.count === 1 ? "entity" : "entities"}`,
                      x: category.x,
                      y: category.y,
                    })
                  }
                  onPointerLeave={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectCategory?.(category.id);
                  }}
                />
              </g>
            );
          })}

          {/* The tenant at the centre. */}
          <g>
            <circle cx={layout.hub.x} cy={layout.hub.y} r={17} fill="var(--tenant)" opacity={0.18} />
            <circle
              cx={layout.hub.x}
              cy={layout.hub.y}
              r={10}
              fill="var(--tenant)"
              stroke="var(--surface-sunken)"
              strokeWidth={2.5}
            />
            <text
              x={layout.hub.x}
              y={layout.hub.y + 30}
              textAnchor="middle"
              className="fill-[var(--ink)]"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {COMPANY.name}
            </text>
          </g>
        </g>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 max-w-[16rem] rounded-lg bg-surface-inverse px-2.5 py-1.5 text-[11px] text-ink-inverse shadow-lg"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <div className="font-medium">{hovered.label}</div>
          <div className="opacity-70">{hovered.sublabel}</div>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col gap-1 rounded-lg bg-surface p-1 shadow-sm ring-hairline">
        {[
          { label: "Zoom in", symbol: "+", action: () => setZoom((z) => Math.min(3, z + 0.25)) },
          { label: "Zoom out", symbol: "−", action: () => setZoom((z) => Math.max(0.5, z - 0.25)) },
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
    </div>
  );
}
