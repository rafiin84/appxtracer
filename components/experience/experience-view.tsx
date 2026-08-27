"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { ExperienceSegment } from "@/types";
import { useExperience } from "@/hooks/use-experience";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Meter } from "@/components/ui/progress";
import { StatTile } from "@/components/shared/stat-tile";
import { HealthBadge, HealthDot } from "@/components/shared/health-badge";
import { TrendPill } from "@/components/shared/trend-pill";
import { LineChart } from "@/components/shared/charts/line-chart";
import { BarChart } from "@/components/shared/charts/bar-chart";
import { ErrorState, LoadingCard, PartialDataNote } from "@/components/shared/states";
import {
  formatCompactNumber,
  formatLatency,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { scoreHealth } from "@/lib/calculations/health";

type Dimension = ExperienceSegment["dimension"];

const DIMENSION_LABEL: Record<Dimension, string> = {
  region: "Region",
  device: "Device",
  "customer-tier": "Customer tier",
  "app-version": "App version",
  network: "Network",
};

/**
 * Experience across the estate, cut by the dimensions that actually separate
 * customers from one another. The worst segment is named rather than left for
 * the reader to find.
 */
export function ExperienceView() {
  const { data, isLoading, isError, error, refetch } = useExperience();
  const [dimension, setDimension] = React.useState<Dimension>("region");

  if (isLoading) {
    return (
      <PageShell width="wide" className="space-y-8">
        <LoadingCard lines={10} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell width="wide" className="space-y-8">
        <ErrorState
          description={error?.message ?? "Experience data could not be loaded for this window."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const payload = data.data;
  const segments = payload.segments.filter((s) => s.dimension === dimension);
  const worst = payload.segments.find((s) => s.id === payload.worstSegmentId);
  const dimensions = [...new Set(payload.segments.map((s) => s.dimension))];

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="Are my customers having a good experience?"
        title="Experience"
        description="A composite of speed, reliability, availability and task completion across every customer-facing surface."
        meta={<HealthBadge health={scoreHealth(payload.score.value)} size="md" />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-5 sm:p-6">
          <p className="text-[12px] font-medium text-ink-secondary">Experience score</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-5xl font-semibold leading-none tracking-[-0.03em] text-ink">
              {payload.score.value.toFixed(1)}
            </span>
            <span className="text-[13px] text-ink-muted">of 100 · {payload.score.band}</span>
          </div>
          <div className="mt-2.5">
            <TrendPill trend={payload.score.trend} />
          </div>

          <dl className="mt-6 space-y-3.5">
            {payload.score.components.map((component) => (
              <div key={component.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="flex items-center gap-2 text-[12.5px] text-ink">
                    <HealthDot health={component.health} />
                    {component.label}
                    <span className="text-ink-muted">
                      {formatPercent(component.weight * 100, 0)} weight
                    </span>
                  </dt>
                  <dd className="text-[13px] font-semibold tabular text-ink">{component.value}</dd>
                </div>
                <Meter
                  className="mt-1.5"
                  value={component.value}
                  tone={
                    component.health === "critical"
                      ? "critical"
                      : component.health === "impaired"
                        ? "serious"
                        : component.health === "degraded"
                          ? "warning"
                          : "good"
                  }
                  label={component.label}
                />
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-4 sm:p-5">
          <LineChart
            title="Experience score over the window"
            series={[
              {
                id: "experience",
                label: "Experience score",
                points: payload.series.experience.points,
                slot: 0,
                area: true,
              },
            ]}
            unit="score"
            height={260}
            baseline={payload.series.experience.baseline}
            baselineLabel="Target 90"
            markers={payload.series.experience.markers}
          />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatNumber(payload.affectedCustomers)}
            footnote={`of ${formatCompactNumber(payload.activeCustomers)} active`}
            emphasis="critical"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="p95 latency"
            value={formatLatency(payload.p95LatencyMs)}
            spark={payload.series.latency.points}
            sparkSlot={1}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Error rate"
            value={formatPercent(payload.errorRatePct)}
            spark={payload.series.errorRate.points}
            sparkTone="critical"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Availability"
            value={formatPercent(payload.availabilityPct, 2)}
            footnote={`Apdex ${payload.apdex.toFixed(2)}`}
            spark={payload.series.availability.points}
            sparkTone="good"
          />
        </Card>
      </div>

      <PartialDataNote availability={data.meta.availability} />

      {worst && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <HealthBadge health={worst.health} size="md" />
            <p className="min-w-0 flex-1 text-[13.5px] text-ink text-pretty">
              <span className="font-semibold">{worst.label}</span> is the worst-served segment:{" "}
              {formatNumber(worst.customersAffected)} of{" "}
              {formatCompactNumber(worst.customersTotal)} customers affected, experience score{" "}
              {worst.experienceScore}, p95 {formatLatency(worst.p95LatencyMs)}.
            </p>
            <Link
              href="/incidents"
              className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover"
            >
              See what is causing it
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </Card>
      )}

      <Section
        id="segments"
        title="Impacted segments"
        question="Who is having the worst experience?"
        actions={
          <Segmented<Dimension>
            label="Segment dimension"
            value={dimension}
            onChange={setDimension}
            size="sm"
            options={dimensions.map((d) => ({ value: d, label: DIMENSION_LABEL[d] }))}
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <BarChart
              title="Experience score"
              subtitle={`By ${DIMENSION_LABEL[dimension].toLowerCase()} · lower is worse`}
              valueLabel="Experience score"
              max={100}
              rows={[...segments]
                .sort((a, b) => a.experienceScore - b.experienceScore)
                .map((segment) => ({
                  id: segment.id,
                  label: segment.label,
                  value: segment.experienceScore,
                  display: String(segment.experienceScore),
                  tone:
                    segment.health === "critical"
                      ? "critical"
                      : segment.health === "impaired"
                        ? "serious"
                        : segment.health === "degraded"
                          ? "warning"
                          : "good",
                  meta: `${formatNumber(segment.customersAffected)} affected · p95 ${formatLatency(segment.p95LatencyMs)} · ${formatPercent(segment.errorRatePct)} errors`,
                }))}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto" data-slot="scroll-thin">
                <table className="w-full min-w-[30rem] border-collapse text-[12.5px]">
                  <caption className="sr-only">
                    Experience by {DIMENSION_LABEL[dimension].toLowerCase()}
                  </caption>
                  <thead>
                    <tr>
                      {["Segment", "Affected", "Score", "p95", "Errors", "At risk"].map((c, i) => (
                        <th
                          key={c}
                          scope="col"
                          className={`hairline-b px-2 py-2 font-medium text-ink-muted ${i === 0 ? "text-left" : "text-right"}`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((segment) => (
                      <tr key={segment.id}>
                        <th scope="row" className="px-2 py-2 text-left font-medium text-ink">
                          <span className="flex items-center gap-2">
                            <HealthDot health={segment.health} />
                            {segment.label}
                          </span>
                        </th>
                        <td className="px-2 py-2 text-right tabular text-ink">
                          {formatNumber(segment.customersAffected)}
                        </td>
                        <td className="px-2 py-2 text-right tabular text-ink">
                          {segment.experienceScore}
                        </td>
                        <td className="px-2 py-2 text-right tabular text-ink-secondary">
                          {formatLatency(segment.p95LatencyMs)}
                        </td>
                        <td className="px-2 py-2 text-right tabular text-ink-secondary">
                          {formatPercent(segment.errorRatePct)}
                        </td>
                        <td className="px-2 py-2 text-right tabular text-ink-secondary">
                          {segment.valueAtRisk ? formatMoneyCompact(segment.valueAtRisk) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="journeys" title="Journey health" question="Which outcomes are suffering?">
        <Card className="p-4 sm:p-5">
          <BarChart
            valueLabel="Journey health score"
            max={100}
            rows={[...payload.journeys]
              .sort((a, b) => a.score - b.score)
              .map((journey) => ({
                id: journey.journeyId,
                label: journey.name,
                value: journey.score,
                display: String(journey.score),
                tone:
                  journey.health === "critical"
                    ? "critical"
                    : journey.health === "impaired"
                      ? "serious"
                      : journey.health === "degraded"
                        ? "warning"
                        : "good",
              }))}
          />
        </Card>
      </Section>
    </PageShell>
  );
}
