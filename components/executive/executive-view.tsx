"use client";

import Link from "next/link";
import { ArrowRight, TrendDown, TrendUp, Minus } from "@phosphor-icons/react/dist/ssr";
import type { ExecutiveInsight } from "@/types";
import { useExecutiveInsights } from "@/hooks/use-executive";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart } from "@/components/shared/charts/line-chart";
import { BarChart } from "@/components/shared/charts/bar-chart";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { ErrorState, LoadingCard, PartialDataNote } from "@/components/shared/states";
import {
  formatDate,
  formatMoneyCompact,
  formatSignedPercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

const DIRECTION = {
  improving: { icon: TrendUp, tone: "good", label: "Improving" },
  worsening: { icon: TrendDown, tone: "critical", label: "Worsening" },
  stable: { icon: Minus, tone: "neutral", label: "Stable" },
} as const;

const CATEGORY_LABEL: Record<ExecutiveInsight["category"], string> = {
  "experience-trend": "Experience",
  "revenue-trend": "Revenue",
  "recurring-incident": "Recurring",
  "problem-application": "Application",
  "problem-journey": "Journey",
  regional: "Regional",
  "change-quality": "Change quality",
  reliability: "Reliability",
  risk: "Risk",
};

/**
 * The longer horizon.
 *
 * Where the Command Center answers "what is happening now", this answers "what
 * has been happening" — trends, recurrence, and the structural problems that
 * individual incident reviews keep missing because each one closes in isolation.
 */
export function ExecutiveInsightsView() {
  const { data, isLoading, isError, error, refetch } = useExecutiveInsights();

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
          description={error?.message ?? "Executive insights could not be assembled."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const payload = data.data;

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="Is digital experience getting better or worse?"
        title="Executive Insights"
        description={`${payload.period}. Trends, recurrence and structural risk across the app — the view a board conversation is built from.`}
      />

      <PartialDataNote availability={payload.availability} />

      <Section id="trends" title="The four numbers that move" question="What is the trajectory?">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <LineChart
              title="Experience score"
              subtitle="Composite across all journeys"
              series={[
                { id: "experience", label: "Experience score", points: payload.trends.experience.points, slot: 0, area: true },
              ]}
              unit="score"
              height={180}
              baseline={payload.trends.experience.baseline}
              baselineLabel="Target 90"
            />
          </Card>
          <Card className="p-4 sm:p-5">
            <LineChart
              title="Value at risk"
              subtitle="Modelled transaction value, per day"
              series={[
                { id: "var", label: "Value at risk", points: payload.trends.valueAtRisk.points, slot: 7, area: true },
              ]}
              unit="currency"
              height={180}
            />
          </Card>
          <Card className="p-4 sm:p-5">
            <LineChart
              title="Incidents per week"
              series={[
                { id: "incidents", label: "Incidents", points: payload.trends.incidentCount.points, slot: 1, area: true },
              ]}
              unit="count"
              height={180}
            />
          </Card>
          <Card className="p-4 sm:p-5">
            <LineChart
              title="Change failure rate"
              subtitle="Changes followed by a correlated degradation within two hours"
              series={[
                { id: "cfr", label: "Change failure rate", points: payload.trends.changeFailureRate.points, slot: 3, area: true },
              ]}
              unit="pct"
              height={180}
              baseline={payload.trends.changeFailureRate.baseline}
              baselineLabel="Prior quarter 12%"
            />
          </Card>
        </div>
      </Section>

      <Section id="insights" title="What the data is saying" question="What should leadership know?">
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.insights.map((insight) => {
            const direction = DIRECTION[insight.direction];
            const Icon = direction.icon;
            return (
              <Card key={insight.id} className="flex min-w-0 flex-col">
                <CardHeader>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="outline">{CATEGORY_LABEL[insight.category]}</Badge>
                      <Badge tone={direction.tone}>
                        <Icon weight="bold" aria-hidden />
                        {direction.label}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
                    {insight.narrative}
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11.5px] text-ink-muted">{insight.metric.label}</p>
                      <p className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold leading-none tracking-[-0.02em] text-ink">
                          {insight.metric.value}
                        </span>
                        {insight.metric.deltaPct !== undefined && (
                          <span
                            className={cn(
                              "text-[13px] font-medium tabular",
                              insight.direction === "improving" ? "text-good-ink" : "text-critical-ink",
                            )}
                          >
                            {formatSignedPercent(insight.metric.deltaPct)}
                          </span>
                        )}
                      </p>
                    </div>
                    <EvidenceHandles ids={insight.evidenceIds} title={insight.title} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="problem-apps" title="Top problem applications" question="Where does impact concentrate?">
          <Card className="p-4 sm:p-5">
            <BarChart
              valueLabel="Value at risk this quarter"
              rows={payload.topProblemApplications.map((app) => ({
                id: app.applicationId,
                label: app.name,
                value: app.valueAtRisk.amount,
                display: formatMoneyCompact(app.valueAtRisk),
                tone: "critical",
                meta: `${app.incidents} incidents`,
              }))}
            />
          </Card>
        </Section>

        <Section id="problem-journeys" title="Top problem journeys" question="Which outcomes keep breaking?">
          <Card className="p-4 sm:p-5">
            <BarChart
              valueLabel="Value at risk this quarter"
              rows={payload.topProblemJourneys.map((journey) => ({
                id: journey.journeyId,
                label: journey.name,
                value: journey.valueAtRisk.amount,
                display: formatMoneyCompact(journey.valueAtRisk),
                tone: "serious",
                meta: `${journey.breaches} SLO breaches`,
              }))}
            />
          </Card>
        </Section>
      </div>

      <Section
        id="recurring"
        title="Recurring incident signatures"
        question="What keeps happening?"
        description="Grouped by failure signature rather than by incident, which is how the same structural problem stops looking like unrelated bad luck."
      >
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <ul className="divide-y divide-[var(--line)]">
              {payload.recurringIncidents.map((recurrence) => (
                <li key={recurrence.signature} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 text-[13.5px] font-medium text-ink text-pretty">
                      {recurrence.signature}
                    </p>
                    <Badge tone="warning">{recurrence.occurrences} occurrences</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[12px] text-ink-muted">
                    <span>Most recent {formatDate(recurrence.lastAt)}</span>
                    {recurrence.incidentIds.map((id) => (
                      <Link
                        key={id}
                        href={`/incidents/${id}`}
                        className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover"
                      >
                        {id}
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}
