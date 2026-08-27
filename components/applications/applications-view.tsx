"use client";

import * as React from "react";
import { useApplications } from "@/hooks/use-applications";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import {
  ApplicationImpactHeader,
  ApplicationImpactList,
  ApplicationImpactRow,
} from "./application-impact-row";
import { EmptyState, ErrorState, LoadingCard } from "@/components/shared/states";
import { formatCompactNumber } from "@/lib/formatters";
import { byHealth, isUnhealthy } from "@/lib/calculations/health";

type Sort = "impact" | "health" | "latency" | "name";

export function ApplicationsView() {
  const { data, isLoading, isError, error, refetch } = useApplications();
  const [sort, setSort] = React.useState<Sort>("impact");
  const [term, setTerm] = React.useState("");

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard lines={10} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState
          description={error?.message ?? "The application inventory could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { applications, summary } = data.data;
  const filtered = applications.filter(
    (a) =>
      !term ||
      a.name.toLowerCase().includes(term.toLowerCase()) ||
      a.owner.team.toLowerCase().includes(term.toLowerCase()),
  );

  const sorted =
    sort === "impact"
      ? [...filtered].sort(
          (a, b) => b.valueAtRisk.amount - a.valueAtRisk.amount || b.customersAffected - a.customersAffected,
        )
      : sort === "health"
        ? byHealth(filtered, (a) => a.health)
        : sort === "latency"
          ? [...filtered].sort((a, b) => b.p95LatencyMs - a.p95LatencyMs)
          : [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const hurting = sorted.filter((a) => isUnhealthy(a.health));
  const healthy = sorted.filter((a) => !isUnhealthy(a.health));

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="Which applications are hurting the business?"
        title="Applications"
        description="Every application, ranked by the business impact it is carrying rather than by how loudly it is alerting."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile label="Applications" value={summary.total} footnote="In production" />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Degraded or worse"
            value={summary.degraded + summary.critical}
            emphasis={summary.critical > 0 ? "critical" : "default"}
            footnote={`${summary.critical} critical · ${summary.degraded} degraded`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatCompactNumber(
              applications.reduce((sum, a) => sum + a.customersAffected, 0),
            )}
            footnote="Counted per application, so journeys overlap"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact
            label="Total value at risk"
            money={summary.totalValueAtRisk}
            size="lg"
          />
          <p className="mt-2 text-[11.5px] text-ink-muted">
            Deduplicated — checkout and payments describe one incident from two layers.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xs flex-1">
          <label htmlFor="app-filter" className="sr-only">
            Filter applications
          </label>
          <Input
            id="app-filter"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter by name or owning team"
          />
        </div>
        <Segmented<Sort>
          label="Sort applications"
          value={sort}
          onChange={setSort}
          options={[
            { value: "impact", label: "Business impact" },
            { value: "health", label: "Health" },
            { value: "latency", label: "Latency" },
            { value: "name", label: "Name" },
          ]}
        />
      </div>

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            title="No applications match that filter"
            description="Try a different name, or clear the filter to see the full inventory."
          />
        </Card>
      ) : (
        <>
          {hurting.length > 0 && (
            <Section
              id="hurting"
              title="Carrying business impact"
              question="Which need attention?"
            >
              <Card className="px-2 py-3 sm:px-2.5">
                <ApplicationImpactList>
                  <ApplicationImpactHeader />
                  <ul className="mt-1">
                    {hurting.map((application, index) => (
                      <li key={application.id}>
                        <ApplicationImpactRow application={application} rank={index + 1} />
                      </li>
                    ))}
                  </ul>
                </ApplicationImpactList>
              </Card>
            </Section>
          )}

          {healthy.length > 0 && (
            <Section id="healthy" title="Within budget" question="What is behaving?">
              <Card className="px-2 py-3 sm:px-2.5">
                <ApplicationImpactList>
                  <ApplicationImpactHeader />
                  <ul className="mt-1">
                    {healthy.map((application) => (
                      <li key={application.id}>
                        <ApplicationImpactRow application={application} />
                      </li>
                    ))}
                  </ul>
                </ApplicationImpactList>
              </Card>
            </Section>
          )}
        </>
      )}
    </PageShell>
  );
}
