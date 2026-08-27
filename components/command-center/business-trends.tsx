"use client";

import type { CommandCenterPayload } from "@/types";
import { formatCompactNumber } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/shared/charts/line-chart";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { TrendPill } from "@/components/shared/trend-pill";
import { PartialDataNote } from "@/components/shared/states";

/**
 * The two trends a CIO reads together: is the experience getting worse, and is
 * money moving with it? Separate charts on separate axes — never one plot with
 * two y-scales.
 */
export function BusinessTrends({ payload }: { payload: CommandCenterPayload }) {
  const { experience, revenue } = payload;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle>Is experience getting better or worse?</CardTitle>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Composite of speed, reliability, availability and task completion.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold leading-none tracking-[-0.025em] text-ink">
              {experience.score.toFixed(1)}
            </span>
            <span className="text-[13px] text-ink-muted">of 100</span>
            <TrendPill trend={experience.trend} className="ml-auto" />
          </div>
          <div className="mt-4">
            <LineChart
              series={[
                {
                  id: "experience",
                  label: "Experience score",
                  points: experience.series.points,
                  slot: 0,
                  area: true,
                },
              ]}
              unit="score"
              height={160}
              baseline={experience.series.baseline}
              baselineLabel="Target 90"
              markers={experience.series.markers}
              dense
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle>How much business is being impacted?</CardTitle>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Revenue flowing per minute, against transaction value modelled as at risk.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-4">
            {revenue.observedWindow && (
              <RevenueImpact
                label="Observed value this window"
                money={revenue.observedWindow}
                size="lg"
              />
            )}
            <RevenueImpact label="Modelled at risk" money={revenue.atRisk} size="md" />
          </div>

          {revenue.series ? (
            <div className="mt-4">
              <LineChart
                series={[
                  {
                    id: "revenue",
                    label: "Revenue per minute",
                    points: revenue.series.points,
                    slot: 2,
                    area: true,
                  },
                ]}
                unit="currency"
                height={160}
                markers={revenue.series.markers}
                dense
                ariaSummary={`Revenue per minute fell from about ${formatCompactNumber(
                  revenue.series.points[0]?.v ?? 0,
                )} dollars to ${formatCompactNumber(
                  revenue.series.points[revenue.series.points.length - 1]?.v ?? 0,
                )} dollars after checkout began failing.`}
              />
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-ink-secondary">
              Revenue data is unavailable for this window.
            </p>
          )}

          <PartialDataNote availability={revenue.availability} className="mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
