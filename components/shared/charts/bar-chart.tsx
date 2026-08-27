"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ChartFrame, ChartTable } from "./chart-frame";

export interface BarRow {
  id: string;
  label: string;
  value: number;
  /** Rendered at the bar's tip. */
  display: string;
  /** Secondary text under the label. */
  meta?: string;
  tone?: "series" | "good" | "warning" | "serious" | "critical";
  href?: string;
}

const TONE_COLOR: Record<NonNullable<BarRow["tone"]>, string> = {
  series: "var(--series-1)",
  good: "var(--good)",
  warning: "var(--warning)",
  serious: "var(--serious)",
  critical: "var(--critical)",
};

/**
 * Horizontal bars for ranked comparison. One series means one colour for every
 * bar — never a value ramp across nominal categories.
 */
export function BarChart({
  rows,
  title,
  subtitle,
  valueLabel,
  onSelect,
  className,
  ariaSummary,
  max,
}: {
  rows: BarRow[];
  title?: string;
  subtitle?: string;
  valueLabel: string;
  onSelect?: (id: string) => void;
  className?: string;
  ariaSummary?: string;
  max?: number;
}) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const ceiling = max ?? Math.max(...rows.map((r) => r.value), 1);

  const summary =
    ariaSummary ??
    `${title ?? valueLabel} by category. ${rows
      .slice(0, 5)
      .map((r) => `${r.label} ${r.display}`)
      .join(", ")}.`;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      series={[]}
      ariaSummary={summary}
      className={className}
      table={
        <ChartTable
          caption={summary}
          columns={["Category", valueLabel]}
          rows={rows.map((r) => [r.label, r.display])}
        />
      }
    >
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const pct = Math.max(1.5, (row.value / ceiling) * 100);
          const colour = TONE_COLOR[row.tone ?? "series"];
          const interactive = Boolean(onSelect);
          return (
            <li key={row.id}>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onSelect?.(row.id)}
                onPointerEnter={() => setHovered(row.id)}
                onPointerLeave={() => setHovered(null)}
                className={cn(
                  "group flex w-full flex-col gap-1 rounded-md px-1 py-0.5 text-left transition-colors",
                  interactive && "hover:bg-surface-sunken",
                  !interactive && "cursor-default",
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-ink">{row.label}</span>
                  <span className="shrink-0 text-[13px] font-semibold tabular text-ink">{row.display}</span>
                </span>
                <span
                  className="block h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-r-[4px] transition-[width,opacity] duration-500"
                    style={{
                      width: `${pct}%`,
                      background: colour,
                      opacity: hovered && hovered !== row.id ? 0.45 : 1,
                    }}
                  />
                </span>
                {row.meta && <span className="text-[11px] text-ink-muted">{row.meta}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
}
