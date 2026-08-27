"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Application } from "@/types";
import {
  formatCompactNumber,
  pluralise,
  formatLatency,
  formatMoneyCompact,
  formatPercent,
} from "@/lib/formatters";
import { HealthDot } from "@/components/shared/health-badge";
import { Sparkline } from "@/components/shared/charts/sparkline";
import { cn } from "@/lib/utils/cn";

/**
 * A dense application row for ranked lists.
 *
 * Business columns lead — customers and money — with latency and error rate as
 * supporting detail, and column labels live in the header once rather than on
 * every row.
 *
 * The breakpoint is a *container* query, not a viewport one: this row appears
 * both in a third-width card on the Command Center and full-width on the
 * Applications screen, and it has to choose its layout from the space it
 * actually has rather than from the size of the window.
 */
const GRID =
  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 " +
  "@[46rem]:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_5.5rem_7.5rem_5rem_1rem]";

/** Wraps a list of rows so they can measure their own width. */
export function ApplicationImpactList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("@container", className)}>{children}</div>;
}

export function ApplicationImpactHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        GRID,
        "hidden px-2.5 pb-1.5 text-[11px] font-medium text-ink-muted hairline-b @[46rem]:grid",
        className,
      )}
    >
      <span />
      <span>Application</span>
      <span className="text-right">Customers</span>
      <span className="text-right">At risk</span>
      <span className="text-right">p95 · errors</span>
      <span className="text-right">Trend</span>
      <span />
    </div>
  );
}

export function ApplicationImpactRow({
  application,
  rank,
  className,
}: {
  application: Application;
  rank?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className={cn(
        GRID,
        "group rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface-sunken",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        {rank !== undefined && (
          <span className="w-4 text-right text-[12px] tabular text-ink-muted">{rank}</span>
        )}
        <HealthDot health={application.health} />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-medium text-ink">{application.name}</span>
        <span className="block truncate text-[11.5px] text-ink-muted">
          {application.owner.team} · {application.journeyIds.length}{" "}
          {pluralise(application.journeyIds.length, "journey")} served
        </span>
      </span>

      <span className="hidden text-right text-[13px] font-semibold tabular text-ink @[46rem]:block">
        {application.customersAffected > 0
          ? formatCompactNumber(application.customersAffected)
          : "—"}
      </span>

      <span className="hidden text-right text-[13px] font-semibold tabular text-ink @[46rem]:block">
        {application.valueAtRisk.amount > 0 ? formatMoneyCompact(application.valueAtRisk) : "—"}
      </span>

      <span className="hidden text-right text-[12.5px] tabular text-ink-secondary @[46rem]:block">
        {formatLatency(application.p95LatencyMs)} · {formatPercent(application.errorRatePct)}
      </span>

      <span className="hidden justify-end @[46rem]:flex">
        <Sparkline
          points={application.series.latency.points.slice(-24)}
          tone={application.health === "healthy" ? "muted" : "critical"}
          width={64}
          height={22}
        />
      </span>

      <ArrowRight
        className="hidden size-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 @[46rem]:block"
        aria-hidden
      />

      {/* Narrow containers get the metrics inline under the name instead. */}
      <span className="col-span-2 flex flex-wrap items-center gap-x-3 text-[11.5px] tabular text-ink-secondary @[46rem]:hidden">
        <span>
          {application.customersAffected > 0
            ? `${formatCompactNumber(application.customersAffected)} affected`
            : "No customers affected"}
        </span>
        {application.valueAtRisk.amount > 0 && (
          <span>{formatMoneyCompact(application.valueAtRisk)} at risk</span>
        )}
        <span>{formatLatency(application.p95LatencyMs)}</span>
        <span>{formatPercent(application.errorRatePct)} errors</span>
      </span>
    </Link>
  );
}
