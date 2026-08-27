"use client";

import Link from "next/link";
import { ArrowRight, Users } from "@phosphor-icons/react/dist/ssr";
import type { BusinessJourney } from "@/types";
import {
  formatCompactNumber,
  formatLatency,
  formatMoneyCompact,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/progress";
import { CriticalityBadge, HealthBadge } from "@/components/shared/health-badge";
import { TrendPill } from "@/components/shared/trend-pill";
import { Sparkline } from "@/components/shared/charts/sparkline";
import { cn } from "@/lib/utils/cn";

const HEALTH_TONE = {
  healthy: "good",
  degraded: "warning",
  impaired: "serious",
  critical: "critical",
  unknown: "accent",
} as const;

/**
 * One journey, framed the way a business owner would describe it: what it is
 * for, how many customers it is failing, and what that is worth.
 */
export function JourneyHealthCard({
  journey,
  className,
}: {
  journey: BusinessJourney;
  className?: string;
}) {
  const slo = journey.slo;
  const breaching = slo ? journey.successRatePct < slo.successRatePct : false;

  return (
    <Card interactive className={cn("group flex min-w-0 flex-col", className)}>
      <Link href={`/journeys/${journey.id}`} className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {journey.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-secondary">
              {journey.businessDescription}
            </p>
          </div>
          <ArrowRight
            className="mt-0.5 size-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <HealthBadge health={journey.health} />
          <CriticalityBadge criticality={journey.criticality} />
          {breaching && (
            <span className="rounded-md bg-critical-soft px-1.5 py-0.5 text-[11px] font-medium text-critical-ink">
              SLO breached
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="min-w-0">
            <dt className="text-[11.5px] text-ink-muted">Customers affected</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[17px] font-semibold tabular text-ink">
              <Users className="size-4 shrink-0 text-ink-muted" aria-hidden />
              {formatCompactNumber(journey.customersAffected)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11.5px] text-ink-muted">Value at risk</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tabular text-ink">
              {journey.valueAtRisk.amount > 0 ? formatMoneyCompact(journey.valueAtRisk) : "—"}
              {journey.valueAtRisk.amount > 0 && (
                <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-derived">
                  est.
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11.5px] text-ink-muted">Success rate</span>
            <span className="text-[13px] font-semibold tabular text-ink">
              {formatPercent(journey.successRatePct)}
              {slo && <span className="ml-1 font-normal text-ink-muted">target {formatPercent(slo.successRatePct)}</span>}
            </span>
          </div>
          <Meter
            className="mt-1.5"
            value={journey.successRatePct}
            tone={HEALTH_TONE[journey.health]}
            label={`${journey.name} success rate`}
          />
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 hairline-t pt-3">
          <div className="min-w-0 space-y-1">
            <TrendPill trend={journey.successRateTrend} showComparison={false} />
            <p className="truncate text-[11.5px] text-ink-muted">
              p95 {formatLatency(journey.p95LatencyMs)}
              {journey.degradedSince && ` · degraded ${formatRelative(journey.degradedSince)}`}
            </p>
          </div>
          <Sparkline
            points={journey.series.successRate.points.slice(-32)}
            tone={journey.health === "healthy" ? "good" : "critical"}
          />
        </div>
      </Link>
    </Card>
  );
}
