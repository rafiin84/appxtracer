"use client";

import * as React from "react";
import type { MetricPoint, SeriesMarker, TimeSeries } from "@/types";
import { formatTime, formatUnit } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { buildScale, nearestIndex, niceTicks, smoothPath, type Box } from "./geometry";
import { ChartFrame, ChartTable, type ChartSeriesMeta } from "./chart-frame";

export interface LineSeries {
  id: string;
  label: string;
  points: MetricPoint[];
  slot: number;
  /** Draw a translucent wash under the line. Reserved for a single-series chart. */
  area?: boolean;
}

const DEFAULT_BOX: Box = {
  width: 720,
  height: 200,
  padding: { top: 12, right: 16, bottom: 22, left: 44 },
};

export function LineChart({
  series,
  unit,
  title,
  subtitle,
  height = 200,
  baseline,
  baselineLabel,
  markers,
  min,
  max,
  ariaSummary,
  className,
  dense,
  actions,
}: {
  series: LineSeries[];
  unit: TimeSeries["unit"];
  title?: string;
  subtitle?: string;
  height?: number;
  baseline?: number;
  baselineLabel?: string;
  markers?: SeriesMarker[];
  min?: number;
  max?: number;
  ariaSummary?: string;
  className?: string;
  dense?: boolean;
  actions?: React.ReactNode;
}) {
  const box: Box = { ...DEFAULT_BOX, height };
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hover, setHover] = React.useState<number | null>(null);

  const points = series.map((s) => s.points);
  const count = points[0]?.length ?? 0;
  const scale = React.useMemo(
    () =>
      buildScale(baseline !== undefined ? [...points, [{ t: "", v: baseline }]] : points, box, {
        min,
        max,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, height, min, max, baseline],
  );

  const ticks = niceTicks(scale.min, scale.max, 4);

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !count) return;
    setHover(nearestIndex(event.clientX, rect, box, count));
  };

  const meta: ChartSeriesMeta[] = series.map((s) => ({ id: s.id, label: s.label, slot: s.slot }));
  const last = series[0]?.points[count - 1];

  const summary =
    ariaSummary ??
    `${title ?? "Time series"}. ${series
      .map((s) => {
        const first = s.points[0]?.v ?? 0;
        const final = s.points[s.points.length - 1]?.v ?? 0;
        const direction = final > first ? "rose" : final < first ? "fell" : "held steady";
        return `${s.label} ${direction} from ${formatUnit(first, unit)} to ${formatUnit(final, unit)}`;
      })
      .join("; ")}.`;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      series={meta}
      ariaSummary={summary}
      className={className}
      dense={dense}
      actions={actions}
      table={
        <ChartTable
          caption={summary}
          columns={["Time", ...series.map((s) => s.label)]}
          rows={(points[0] ?? []).map((p, i) => [
            formatTime(p.t),
            ...series.map((s) => formatUnit(s.points[i]?.v ?? 0, unit)),
          ])}
        />
      }
    >
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="none"
          className="w-full touch-none"
          style={{ height }}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {/* Gridlines: hairline, solid, one step off surface. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={box.padding.left}
                x2={box.width - box.padding.right}
                y1={scale.y(tick)}
                y2={scale.y(tick)}
                stroke="var(--grid)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={box.padding.left - 8}
                y={scale.y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-[var(--ink-muted)] text-[10px] tabular"
                style={{ fontSize: 10 }}
              >
                {formatUnit(tick, unit)}
              </text>
            </g>
          ))}

          {baseline !== undefined && (
            <g>
              <line
                x1={box.padding.left}
                x2={box.width - box.padding.right}
                y1={scale.y(baseline)}
                y2={scale.y(baseline)}
                stroke="var(--axis)"
                strokeWidth={1}
                strokeDasharray="0"
                opacity={0.9}
              />
              {baselineLabel && (
                <text
                  x={box.padding.left + 6}
                  y={scale.y(baseline) - 5}
                  textAnchor="start"
                  className="fill-[var(--ink-muted)]"
                  style={{ fontSize: 10 }}
                >
                  {baselineLabel}
                </text>
              )}
            </g>
          )}

          {/* Event markers — deployments and incident starts. */}
          {markers?.map((marker) => {
            const index = (points[0] ?? []).findIndex((p) => new Date(p.t) >= new Date(marker.t));
            if (index < 0) return null;
            const x = scale.x(index);
            return (
              <g key={`${marker.t}-${marker.label}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={box.padding.top}
                  y2={box.height - box.padding.bottom}
                  stroke={marker.kind === "incident" ? "var(--critical)" : "var(--ink-muted)"}
                  strokeWidth={1}
                  opacity={0.5}
                />
                <circle cx={x} cy={box.padding.top} r={3} fill={marker.kind === "incident" ? "var(--critical)" : "var(--ink-muted)"} />
              </g>
            );
          })}

          {series.map((s) => {
            const coords = s.points.map((p, i) => ({ x: scale.x(i), y: scale.y(p.v) }));
            const path = smoothPath(coords);
            const colour = `var(--series-${(s.slot % 8) + 1})`;
            return (
              <g key={s.id}>
                {s.area && series.length === 1 && (
                  <path
                    d={`${path} L ${coords[coords.length - 1]?.x ?? 0} ${box.height - box.padding.bottom} L ${coords[0]?.x ?? 0} ${box.height - box.padding.bottom} Z`}
                    fill={colour}
                    opacity={0.1}
                  />
                )}
                <path d={path} fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {coords.length > 0 && (
                  <circle
                    cx={coords[coords.length - 1].x}
                    cy={coords[coords.length - 1].y}
                    r={4}
                    fill={colour}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line
                x1={scale.x(hover)}
                x2={scale.x(hover)}
                y1={box.padding.top}
                y2={box.height - box.padding.bottom}
                stroke="var(--ink-muted)"
                strokeWidth={1}
              />
              {series.map((s) => {
                const p = s.points[hover];
                if (!p) return null;
                return (
                  <circle
                    key={s.id}
                    cx={scale.x(hover)}
                    cy={scale.y(p.v)}
                    r={4.5}
                    fill={`var(--series-${(s.slot % 8) + 1})`}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hover !== null && points[0]?.[hover] && (
          <div
            className={cn(
              "pointer-events-none absolute top-1 z-10 min-w-[9rem] rounded-lg bg-surface-inverse px-2.5 py-1.5 text-[11px] text-ink-inverse shadow-lg",
            )}
            style={{
              left: `${(scale.x(hover) / box.width) * 100}%`,
              transform:
                scale.x(hover) / box.width > 0.62 ? "translateX(-104%)" : "translateX(8px)",
            }}
          >
            <div className="font-medium opacity-70">{formatTime(points[0][hover].t)}</div>
            {series.map((s) => (
              <div key={s.id} className="mt-1 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-2.5 rounded-full"
                    style={{ background: `var(--series-${(s.slot % 8) + 1})` }}
                  />
                  {s.label}
                </span>
                <span className="tabular font-medium">{formatUnit(s.points[hover]?.v ?? 0, unit)}</span>
              </div>
            ))}
          </div>
        )}

        {last && (
          <span className="sr-only">
            Latest value {formatUnit(last.v, unit)} at {formatTime(last.t)}.
          </span>
        )}
      </div>
    </ChartFrame>
  );
}
