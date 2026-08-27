"use client";

import Link from "next/link";
import { ArrowRight, Clock, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { useApplication } from "@/hooks/use-applications";
import { useJourneys } from "@/hooks/use-journeys";
import { useIncidents } from "@/hooks/use-incidents";
import { useChanges } from "@/hooks/use-changes";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/progress";
import { CriticalityBadge, HealthBadge, HealthDot } from "@/components/shared/health-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { LineChart } from "@/components/shared/charts/line-chart";
import { ErrorState, LoadingCard } from "@/components/shared/states";
import { JourneyHealthCard } from "@/components/journeys/journey-health-card";
import { IncidentImpactCard } from "@/components/incidents/incident-impact-card";
import { ChangeCorrelationCard } from "@/components/changes/change-correlation";
import {
  formatCompactNumber,
  formatLatency,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";

const KIND_LABEL: Record<string, string> = {
  web: "Web application",
  mobile: "Mobile application",
  api: "API",
  backend: "Backend service estate",
  batch: "Batch",
  edge: "Edge",
};

export function ApplicationDetailView({ applicationId }: { applicationId: string }) {
  const { data, isLoading, isError, error, refetch } = useApplication(applicationId);
  const { data: journeysData } = useJourneys();
  const { data: incidentsData } = useIncidents();
  const { data: changesData } = useChanges();

  if (isLoading) {
    return (
      <PageShell width="wide" className="space-y-8">
        <LoadingCard lines={8} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell width="wide" className="space-y-8">
        <ErrorState
          title="Application not found"
          description={error?.message ?? `No application matches "${applicationId}".`}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { application, services } = data.data;
  const allJourneys = [
    ...(journeysData?.data.journeys ?? []),
    ...(journeysData?.data.proposed ?? []),
  ];
  const journeys = allJourneys.filter((j) => application.journeyIds.includes(j.id));
  const incidents = (incidentsData?.data.incidents ?? []).filter((i) =>
    application.incidentIds.includes(i.id),
  );
  const changes = (changesData?.data.changes ?? []).filter((c) =>
    application.changeIds.includes(c.id),
  );

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        back={{ href: "/applications", label: "All applications" }}
        question="What is this application doing to the business?"
        title={application.name}
        description={application.description}
        meta={
          <>
            <HealthBadge health={application.health} size="md" />
            <CriticalityBadge criticality={application.criticality} />
            <Badge tone="outline">{KIND_LABEL[application.kind] ?? application.kind}</Badge>
            <Badge tone="outline">{application.environment}</Badge>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-secondary">
              <UserCircle className="size-4 text-ink-muted" aria-hidden />
              {application.owner.name} · {application.owner.team}
            </span>
            {application.degradedSince && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <Clock className="size-3.5" aria-hidden />
                Degraded {formatRelative(application.degradedSince)}
              </span>
            )}
          </>
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/impact?origin=${application.id}`}>
              Model a failure
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatCompactNumber(application.customersAffected)}
            footnote={`of ${formatCompactNumber(application.customersServed)} served`}
            emphasis={application.customersAffected > 0 ? "critical" : "default"}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="p95 latency"
            value={formatLatency(application.p95LatencyMs)}
            trend={application.latencyTrend}
            spark={application.series.latency.points}
            sparkSlot={1}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Error rate"
            value={formatPercent(application.errorRatePct)}
            trend={application.errorRateTrend}
            spark={application.series.errorRate.points}
            sparkTone={application.health === "healthy" ? "muted" : "critical"}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact label="Value at risk" money={application.valueAtRisk} size="lg" />
          <p className="mt-2 text-[11.5px] text-ink-muted">
            Availability {formatPercent(application.availabilityPct, 2)} · Apdex{" "}
            {application.apdex.toFixed(2)}
          </p>
        </Card>
      </div>

      <Section id="telemetry" title="Behaviour over the window" question="What changed and when?">
        <Card className="p-4 sm:p-5">
          <div className="grid gap-6 lg:grid-cols-3">
            <LineChart
              title="p95 latency"
              series={[
                { id: "latency", label: "p95 latency", points: application.series.latency.points, slot: 1, area: true },
              ]}
              unit="ms"
              height={170}
              markers={application.series.latency.markers}
            />
            <LineChart
              title="Error rate"
              series={[
                { id: "errors", label: "Error rate", points: application.series.errorRate.points, slot: 7, area: true },
              ]}
              unit="pct"
              height={170}
            />
            <LineChart
              title="Throughput"
              series={[
                { id: "throughput", label: "Requests per second", points: application.series.throughput.points, slot: 0, area: true },
              ]}
              unit="rps"
              height={170}
            />
          </div>
        </Card>
      </Section>

      <Section
        id="dependencies"
        title="Services and dependencies"
        question="What does it rely on?"
        description="Saturation is shown where a service reports it — it is usually the first place pressure becomes visible."
      >
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <ul className="divide-y divide-[var(--line)]">
              {services.map((service) => (
                <li key={service.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <HealthDot health={service.health} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {service.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-muted">
                        {service.kind}
                        {service.vendor ? ` · ${service.vendor}` : ""} · {service.owner.team}
                      </span>
                    </span>
                  </span>

                  <span className="text-[12.5px] tabular text-ink-secondary">
                    p95 {formatLatency(service.p95LatencyMs)}
                  </span>
                  <span className="text-[12.5px] tabular text-ink-secondary">
                    {formatPercent(service.errorRatePct)} errors
                  </span>
                  {service.saturationPct !== undefined && (
                    <span className="w-32 shrink-0">
                      <span className="flex items-baseline justify-between gap-2 text-[11px] text-ink-muted">
                        Saturation
                        <span className="tabular font-medium text-ink">
                          {formatPercent(service.saturationPct, 0)}
                        </span>
                      </span>
                      <Meter
                        className="mt-1"
                        value={service.saturationPct}
                        tone={
                          service.saturationPct > 90
                            ? "critical"
                            : service.saturationPct > 75
                              ? "serious"
                              : "accent"
                        }
                        label={`${service.name} saturation`}
                      />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Section>

      {journeys.length > 0 && (
        <Section id="journeys" title="Journeys served" question="What business outcomes depend on this?">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {journeys.map((journey) => (
              <JourneyHealthCard key={journey.id} journey={journey} />
            ))}
          </div>
        </Section>
      )}

      {incidents.length > 0 && (
        <Section id="incidents" title="Incidents" question="What has gone wrong here?">
          <div className="grid gap-4 lg:grid-cols-2">
            {incidents.map((incident) => (
              <IncidentImpactCard key={incident.id} incident={incident} compact />
            ))}
          </div>
        </Section>
      )}

      {changes.length > 0 && (
        <Section id="changes" title="Recent changes" question="What changed here?">
          <div className="grid gap-4 lg:grid-cols-2">
            {changes.map((change) => (
              <ChangeCorrelationCard key={change.id} change={change} />
            ))}
          </div>
        </Section>
      )}

      <Section id="sources" title="Telemetry sources" question="Where does this data come from?">
        <Card>
          <CardHeader>
            <CardTitle>Contributing systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {application.sourceIds.map((id) => (
                <Badge key={id} tone="outline" size="md">
                  {id.replace("src-", "").replace("-", " ")}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-ink-secondary text-pretty">
              APPX Tracer reads from these systems and connects what they know. It does not replace
              them.
            </p>
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}
