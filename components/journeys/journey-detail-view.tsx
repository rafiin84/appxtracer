"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Sparkle, UserCircle } from "@phosphor-icons/react/dist/ssr";
import type { JourneyStep } from "@/types";
import { useJourney } from "@/hooks/use-journeys";
import { useApplications } from "@/hooks/use-applications";
import { useIncidents } from "@/hooks/use-incidents";
import { useChanges } from "@/hooks/use-changes";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/progress";
import {
  CriticalityBadge,
  HealthBadge,
  HealthDot,
} from "@/components/shared/health-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { LineChart } from "@/components/shared/charts/line-chart";
import { BarChart } from "@/components/shared/charts/bar-chart";
import { ErrorState, LoadingCard } from "@/components/shared/states";
import { JourneyFunnel } from "./journey-funnel";
import { IncidentImpactCard } from "@/components/incidents/incident-impact-card";
import { ChangeCorrelationCard } from "@/components/changes/change-correlation";
import {
  ApplicationImpactHeader,
  ApplicationImpactList,
  ApplicationImpactRow,
} from "@/components/applications/application-impact-row";
import { valueAtRisk } from "@/lib/calculations/impact";
import { WINDOW_IMPACT } from "@/lib/mock/narrative";
import {
  formatCompactNumber,
  formatDate,
  formatLatency,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";

export function JourneyDetailView({ journeyId }: { journeyId: string }) {
  const { data, isLoading, isError, error, refetch } = useJourney(journeyId);
  const { data: applicationsData } = useApplications();
  const { data: incidentsData } = useIncidents();
  const { data: changesData } = useChanges();
  const [selectedStep, setSelectedStep] = React.useState<JourneyStep | undefined>();

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard lines={8} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState
          title="Journey not found"
          description={error?.message ?? `No journey matches "${journeyId}".`}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const journey = data.data;
  const applications = (applicationsData?.data.applications ?? []).filter((a) =>
    journey.applicationIds.includes(a.id),
  );
  const incidents = (incidentsData?.data.incidents ?? []).filter((i) =>
    journey.incidentIds.includes(i.id),
  );
  const changes = (changesData?.data.changes ?? []).filter((c) => journey.changeIds.includes(c.id));

  const { basis } = valueAtRisk({
    failedTransactions: journey.transactionsFailed,
    averageOrderValue: WINDOW_IMPACT.averageOrderValue,
    currency: "USD",
    transactionEvidenceId: "ev-007",
    aovEvidenceId: "ev-009",
  });

  const worstStep = [...journey.steps].sort((a, b) => a.successRatePct - b.successRatePct)[0];

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        back={{ href: "/journeys", label: "All journeys" }}
        question="How is this journey performing?"
        title={journey.name}
        description={journey.businessDescription}
        meta={
          <>
            <HealthBadge health={journey.health} size="md" />
            <CriticalityBadge criticality={journey.criticality} />
            <Badge tone={journey.discovery.state === "governed" ? "good" : "accent"}>
              {journey.discovery.state === "proposed" && <Sparkle weight="fill" aria-hidden />}
              {journey.discovery.state}
            </Badge>
            {journey.owner && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-secondary">
                <UserCircle className="size-4 text-ink-muted" aria-hidden />
                {journey.owner.name} · {journey.owner.team}
              </span>
            )}
            {journey.degradedSince && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <Clock className="size-3.5" aria-hidden />
                Degraded {formatRelative(journey.degradedSince)}
              </span>
            )}
          </>
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/impact?origin=${journey.applicationIds[0] ?? journey.id}`}>
              Model the blast radius
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatCompactNumber(journey.customersAffected)}
            footnote={`of ${formatCompactNumber(journey.customersInWindow)} in this journey`}
            emphasis={journey.customersAffected > 0 ? "critical" : "default"}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Success rate"
            value={formatPercent(journey.successRatePct)}
            trend={journey.successRateTrend}
            spark={journey.series.successRate.points}
            sparkTone={journey.health === "healthy" ? "good" : "critical"}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="p95 latency"
            value={formatLatency(journey.p95LatencyMs)}
            trend={journey.latencyTrend}
            spark={journey.series.latency.points}
            sparkSlot={1}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact
            label="Transaction value at risk"
            money={journey.valueAtRisk}
            basis={basis}
            size="lg"
          />
          <p className="mt-2 text-[11.5px] text-ink-muted">
            {formatCompactNumber(journey.transactionsFailed)} of{" "}
            {formatCompactNumber(journey.transactionsInWindow)} transactions failed
          </p>
        </Card>
      </div>

      {journey.slo && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                Service level objective
              </p>
              <p className="mt-1.5 text-[13.5px] text-ink">
                {formatPercent(journey.slo.successRatePct)} success ·{" "}
                {formatLatency(journey.slo.p95LatencyMs)} p95 · {journey.slo.period}
              </p>
            </div>
            <div className="min-w-[14rem] flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] text-ink-secondary">Error budget remaining</span>
                <span className="text-[13px] font-semibold tabular text-ink">
                  {formatPercent(journey.slo.errorBudgetRemainingPct, 0)}
                </span>
              </div>
              <Meter
                className="mt-1.5"
                value={journey.slo.errorBudgetRemainingPct}
                tone={
                  journey.slo.errorBudgetRemainingPct === 0
                    ? "critical"
                    : journey.slo.errorBudgetRemainingPct < 25
                      ? "serious"
                      : "good"
                }
                label="Error budget remaining"
              />
            </div>
          </div>
        </Card>
      )}

      <Section
        id="funnel"
        title="Journey topology"
        question="Where in the journey are customers falling out?"
        description={
          worstStep
            ? `${worstStep.name} is the weakest step at ${formatPercent(worstStep.successRatePct)} success.`
            : undefined
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <Card className="p-4 sm:p-5">
            <JourneyFunnel
              journey={journey}
              onSelectStep={setSelectedStep}
              selectedStepId={selectedStep?.id}
            />
          </Card>

          <Card className="p-4 sm:p-5">
            {selectedStep ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Selected step
                </p>
                <h3 className="mt-1.5 text-[16px] font-semibold text-ink">{selectedStep.name}</h3>
                <div className="mt-2">
                  <HealthBadge health={selectedStep.health} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Step success rate", formatPercent(selectedStep.successRatePct)],
                    ["Drop-off", formatPercent(selectedStep.dropOffPct)],
                    ["p95 latency", formatLatency(selectedStep.p95LatencyMs)],
                    ["Error rate", formatPercent(selectedStep.errorRatePct)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-surface-sunken p-3">
                      <dt className="text-[11px] text-ink-muted">{label}</dt>
                      <dd className="mt-0.5 text-[15px] font-semibold tabular text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Served by
                </p>
                <ul className="mt-2 space-y-1">
                  {selectedStep.applicationIds.map((id) => {
                    const app = applications.find((a) => a.id === id);
                    return (
                      <li key={id}>
                        <Link
                          href={`/applications/${id}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-surface-sunken"
                        >
                          {app && <HealthDot health={app.health} />}
                          <span className="min-w-0 truncate">{app?.name ?? id}</span>
                          <ArrowRight className="ml-auto size-3 shrink-0 text-ink-muted" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Regional health
                </p>
                <div className="mt-3">
                  <BarChart
                    valueLabel="Success rate"
                    max={100}
                    rows={journey.regionalHealth.map((r) => ({
                      id: r.region,
                      label: r.region,
                      value: r.successRatePct,
                      display: formatPercent(r.successRatePct),
                      tone:
                        r.health === "critical"
                          ? "critical"
                          : r.health === "impaired"
                            ? "serious"
                            : r.health === "degraded"
                              ? "warning"
                              : "good",
                    }))}
                  />
                </div>
                <p className="mt-4 text-[12px] text-ink-muted">
                  Select a step in the funnel to see what serves it.
                </p>
              </div>
            )}
          </Card>
        </div>
      </Section>

      <Section id="timeline" title="Degradation timeline" question="When did this start?">
        <Card className="p-4 sm:p-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <LineChart
              title="Success rate"
              series={[
                {
                  id: "success",
                  label: "Success rate",
                  points: journey.series.successRate.points,
                  slot: 0,
                  area: true,
                },
              ]}
              unit="pct"
              height={180}
              baseline={journey.slo?.successRatePct}
              baselineLabel={journey.slo ? `SLO ${formatPercent(journey.slo.successRatePct)}` : undefined}
              markers={journey.series.successRate.markers}
            />
            <LineChart
              title="p95 latency"
              series={[
                { id: "latency", label: "p95 latency", points: journey.series.latency.points, slot: 1, area: true },
              ]}
              unit="ms"
              height={180}
              baseline={journey.slo?.p95LatencyMs}
              baselineLabel={journey.slo ? `SLO ${formatLatency(journey.slo.p95LatencyMs)}` : undefined}
            />
          </div>
        </Card>
      </Section>

      <Section id="dependencies" title="Applications serving this journey" question="What is it built on?">
        <Card className="px-2 py-3 sm:px-2.5">
          <ApplicationImpactList>
            <ApplicationImpactHeader />
            <ul className="mt-1">
              {applications.map((application) => (
                <li key={application.id}>
                  <ApplicationImpactRow application={application} />
                </li>
              ))}
            </ul>
          </ApplicationImpactList>
        </Card>
      </Section>

      {incidents.length > 0 && (
        <Section id="incidents" title="Incidents affecting this journey" question="What is going wrong?">
          <div className="grid gap-4 lg:grid-cols-2">
            {incidents.map((incident) => (
              <IncidentImpactCard key={incident.id} incident={incident} compact />
            ))}
          </div>
        </Section>
      )}

      {changes.length > 0 && (
        <Section id="changes" title="Related changes" question="What changed?">
          <div className="grid gap-4 lg:grid-cols-2">
            {changes.map((change) => (
              <ChangeCorrelationCard key={change.id} change={change} />
            ))}
          </div>
        </Section>
      )}

      <Section
        id="discovery"
        title="How this journey was discovered"
        question="Where did this definition come from?"
      >
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>
                {journey.discovery.method.replace("-", " ")} ·{" "}
                {formatDate(journey.discovery.discoveredAt)}
              </CardTitle>
              <p className="mt-1 text-[12.5px] text-ink-secondary">
                {journey.discovery.validatedBy
                  ? `Validated by ${journey.discovery.validatedBy.name} (${journey.discovery.validatedBy.team})${
                      journey.discovery.validatedAt
                        ? ` on ${formatDate(journey.discovery.validatedAt)}`
                        : ""
                    }.`
                  : "Not yet validated by a business owner."}
              </p>
            </div>
            <ConfidenceBadge confidence={journey.discovery.confidence} />
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {journey.discovery.signals.map((signal) => (
                <li key={signal} className="flex gap-2 text-[13px] leading-relaxed text-ink-secondary">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-muted" />
                  <span className="text-pretty">{signal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}
