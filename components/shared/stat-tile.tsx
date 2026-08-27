import * as React from "react";
import type { MetricPoint, Trend } from "@/types";
import { cn } from "@/lib/utils/cn";
import { Sparkline } from "./charts/sparkline";
import { TrendPill } from "./trend-pill";

/**
 * The stat tile. Label in sentence case, value as the loudest element, an
 * optional signed delta against a named period and an optional 12-point
 * sparkline that carries shape rather than values.
 */
export function StatTile({
  label,
  value,
  unit,
  trend,
  spark,
  sparkSlot = 0,
  sparkTone,
  footnote,
  emphasis = "default",
  className,
  action,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: Trend;
  spark?: MetricPoint[];
  sparkSlot?: number;
  sparkTone?: "series" | "good" | "critical" | "muted";
  footnote?: React.ReactNode;
  emphasis?: "default" | "critical" | "quiet";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-ink-secondary">{label}</span>
        {action}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span
            className={cn(
              "truncate text-2xl font-semibold leading-none tracking-[-0.02em]",
              emphasis === "critical" ? "text-critical-ink" : emphasis === "quiet" ? "text-ink-secondary" : "text-ink",
            )}
          >
            {value}
          </span>
          {unit && <span className="text-[13px] text-ink-muted">{unit}</span>}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline points={spark.slice(-24)} slot={sparkSlot} tone={sparkTone} />
        )}
      </div>
      {(trend || footnote) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {trend && <TrendPill trend={trend} />}
          {footnote && <span className="text-[12px] text-ink-muted">{footnote}</span>}
        </div>
      )}
    </div>
  );
}
