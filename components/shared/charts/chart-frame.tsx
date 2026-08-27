"use client";

import * as React from "react";
import { Table, ChartLine } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";
import { SectionLabel } from "@/components/ui/card";

export interface ChartSeriesMeta {
  id: string;
  label: string;
  slot: number;
}

/**
 * Every chart in the product is wrapped in this frame, which guarantees three
 * things the design rules require: a legend whenever there are two or more
 * series, an equivalent table view, and a text alternative for screen readers.
 */
export function ChartFrame({
  title,
  subtitle,
  series,
  children,
  table,
  ariaSummary,
  actions,
  className,
  dense,
}: {
  title?: string;
  subtitle?: string;
  series: ChartSeriesMeta[];
  children: React.ReactNode;
  table: React.ReactNode;
  ariaSummary: string;
  actions?: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  const [view, setView] = React.useState<"chart" | "table">("chart");
  const showLegend = series.length >= 2;

  return (
    <figure className={cn("m-0", className)}>
      {(title || actions) && (
        <figcaption className={cn("flex items-start justify-between gap-3", dense ? "mb-2" : "mb-3")}>
          <div className="min-w-0">
            {title && <SectionLabel>{title}</SectionLabel>}
            {subtitle && <p className="mt-1 text-[13px] text-ink-secondary">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <button
              type="button"
              onClick={() => setView(view === "chart" ? "table" : "chart")}
              className="grid size-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              aria-label={view === "chart" ? "Show data as a table" : "Show as a chart"}
              title={view === "chart" ? "Show data as a table" : "Show as a chart"}
            >
              {view === "chart" ? <Table className="size-4" /> : <ChartLine className="size-4" />}
            </button>
          </div>
        </figcaption>
      )}

      {showLegend && (
        <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 text-[12px] text-ink-secondary">
              <span
                aria-hidden
                className="inline-block h-0.5 w-3 rounded-full"
                style={{ background: `var(--series-${(s.slot % 8) + 1})` }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {view === "chart" ? (
        <div role="img" aria-label={ariaSummary}>
          {children}
        </div>
      ) : (
        <div className="overflow-x-auto" data-slot="scroll-thin">
          {table}
        </div>
      )}
    </figure>
  );
}

export function ChartTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
  caption: string;
}) {
  return (
    <table className="w-full min-w-[18rem] border-collapse text-[12px] tabular">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th
              key={c}
              scope="col"
              className={cn(
                "hairline-b px-2 py-1.5 font-medium text-ink-muted",
                i === 0 ? "text-left" : "text-right",
              )}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                className={cn(
                  "px-2 py-1.5 text-ink-secondary",
                  j === 0 ? "text-left" : "text-right text-ink",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
