"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { BusinessJourney } from "@/types";
import {
  formatCompactNumber,
  formatMoneyCompact,
  formatPercent,
} from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/progress";
import { HealthDot } from "@/components/shared/health-badge";
import { EmptyState } from "@/components/shared/states";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

const TONE = {
  healthy: "good",
  degraded: "warning",
  impaired: "serious",
  critical: "critical",
  unknown: "accent",
} as const;

/**
 * Question two: which customer journeys are breaking? Ordered by value at risk,
 * because a 2-point drop on Checkout outranks a 20-point drop on Returns.
 */
export function BreakingJourneysCard({
  journeys,
  total,
  healthy,
}: {
  journeys: BusinessJourney[];
  total: number;
  healthy: number;
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Which journeys are breaking?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            {journeys.length} of {total} degraded · {healthy} healthy · ranked by value at risk
          </p>
        </div>
        <Link
          href="/journeys"
          className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          aria-label="Open all journeys"
        >
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1">
        {journeys.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Every journey is healthy"
            description="All governed journeys are meeting their success-rate and latency targets in this window."
          />
        ) : (
          <ul className="space-y-3">
            {journeys.slice(0, 5).map((journey) => (
              <li key={journey.id}>
                <Link
                  href={`/journeys/${journey.id}`}
                  className="group block rounded-lg px-2 py-2 transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex items-center gap-2">
                    <HealthDot health={journey.health} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                      {journey.name}
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold tabular text-ink">
                      {journey.valueAtRisk.amount > 0
                        ? formatMoneyCompact(journey.valueAtRisk)
                        : "—"}
                    </span>
                  </div>

                  <Meter
                    className="mt-2"
                    value={journey.successRatePct}
                    tone={TONE[journey.health]}
                    label={`${journey.name} success rate`}
                  />

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11.5px] tabular text-ink-muted">
                    <span>{formatPercent(journey.successRatePct)} success</span>
                    {journey.slo && <span>target {formatPercent(journey.slo.successRatePct)}</span>}
                    <span>{formatCompactNumber(journey.customersAffected)} affected</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
