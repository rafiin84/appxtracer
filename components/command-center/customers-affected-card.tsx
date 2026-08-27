"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { ImpactSummary } from "@/types";
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/shared/charts/line-chart";
import { TrendPill } from "@/components/shared/trend-pill";
import { HealthDot } from "@/components/shared/health-badge";
import { PartialDataNote } from "@/components/shared/states";

/**
 * Question one: how many customers are affected? The number is deduplicated
 * across journeys, which the card says explicitly — a naive sum would be 2.5×
 * larger and wrong.
 */
export function CustomersAffectedCard({ impact }: { impact: ImpactSummary }) {
  const topRegions = [...impact.geography]
    .sort((a, b) => b.customersAffected - a.customersAffected)
    .slice(0, 4);

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>How many customers are affected?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            Deduplicated across journeys, sessions and devices.
          </p>
        </div>
        <Link
          href="/experience"
          className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          aria-label="Open the experience view"
        >
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-semibold leading-none tracking-[-0.03em] text-ink">
            {formatNumber(impact.totalCustomersAffected)}
          </span>
          <span className="text-[13px] text-ink-muted">
            {formatPercent(impact.affectedPct, 2)} of active customers
          </span>
        </div>
        <div className="mt-2">
          <TrendPill trend={impact.affectedTrend} />
        </div>

        <div className="mt-4">
          <LineChart
            series={[
              {
                id: "customers-affected",
                label: "Customers affected",
                points: impact.series.customersAffected.points,
                slot: 7,
                area: true,
              },
            ]}
            unit="count"
            height={132}
            dense
            ariaSummary={`Customers affected rose to ${formatNumber(impact.totalCustomersAffected)} across the window, with the sharpest increase when checkout began failing.`}
          />
        </div>

        <div className="mt-4 hairline-t pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
            Where they are
          </p>
          <ul className="mt-2 space-y-1.5">
            {topRegions.map((geo) => (
              <li key={geo.region.code} className="flex items-center gap-2.5 text-[12.5px]">
                <HealthDot health={geo.health} />
                <span className="min-w-0 flex-1 truncate text-ink">{geo.region.name}</span>
                <span className="shrink-0 tabular font-medium text-ink">
                  {formatCompactNumber(geo.customersAffected)}
                </span>
                <span className="w-12 shrink-0 text-right tabular text-ink-muted">
                  {formatPercent((geo.customersAffected / impact.totalCustomersAffected) * 100, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <PartialDataNote availability={impact.availability} className="mt-4" />
      </CardContent>
    </Card>
  );
}
