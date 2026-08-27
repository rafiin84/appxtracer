import type { MetricPoint } from "@/types";
import { cn } from "@/lib/utils/cn";
import { smoothPath } from "./geometry";

/**
 * A 12-to-96 point sparkline for stat tiles. Deliberately unlabelled and
 * non-interactive: it carries shape, and the tile's value carries the number.
 */
export function Sparkline({
  points,
  slot = 0,
  width = 96,
  height = 28,
  className,
  tone,
}: {
  points: MetricPoint[];
  slot?: number;
  width?: number;
  height?: number;
  className?: string;
  tone?: "series" | "good" | "critical" | "muted";
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * (width - 4) + 2,
    y: height - 3 - ((p.v - min) / span) * (height - 6),
  }));

  const colour =
    tone === "good"
      ? "var(--good)"
      : tone === "critical"
        ? "var(--critical)"
        : tone === "muted"
          ? "var(--ink-muted)"
          : `var(--series-${(slot % 8) + 1})`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden
      focusable="false"
    >
      <path
        d={smoothPath(coords)}
        fill="none"
        stroke={colour}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r={2.75}
        fill={colour}
        stroke="var(--surface)"
        strokeWidth={2}
      />
    </svg>
  );
}
