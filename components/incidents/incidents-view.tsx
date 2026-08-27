"use client";

import * as React from "react";
import { useIncidents } from "@/hooks/use-incidents";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { IncidentImpactCard } from "./incident-impact-card";
import { EmptyState, ErrorState, LoadingGrid } from "@/components/shared/states";
import { formatDurationMinutes, formatNumber } from "@/lib/formatters";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

type Filter = "active" | "all" | "sev1";

export function IncidentsView() {
  const { data, isLoading, isError, error, refetch } = useIncidents();
  const [filter, setFilter] = React.useState<Filter>("active");

  if (isLoading) {
    return (
      <PageShell>
        <LoadingGrid count={4} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState
          description={error?.message ?? "Incidents could not be loaded for this window."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { incidents, summary } = data.data;
  const visible =
    filter === "active"
      ? incidents.filter((i) => i.state !== "resolved")
      : filter === "sev1"
        ? incidents.filter((i) => i.severity === "sev1")
        : incidents;

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="What needs my attention right now?"
        title="Incidents"
        description="Framed by business consequence: who is affected, what it is worth, and what is being done about it."
        actions={
          <Segmented<Filter>
            label="Filter incidents"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "active", label: `Active ${summary.active}` },
              { value: "sev1", label: "Sev 1" },
              { value: "all", label: `All ${incidents.length}` },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Active incidents"
            value={summary.active}
            emphasis={summary.active > 0 ? "critical" : "default"}
            footnote={`${summary.resolvedInWindow} resolved in this window`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatNumber(summary.customersAffected)}
            footnote="Deduplicated across open incidents"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact label="Value at risk" money={summary.valueAtRisk} size="lg" />
          <p className="mt-2 text-[11.5px] text-ink-muted">Sum across open incidents</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Median time to identify"
            value={formatDurationMinutes(summary.meanTimeToIdentifyMinutes)}
            footnote="From first alert to an attributed cause"
          />
        </Card>
      </div>

      <Section id="list" title={filter === "active" ? "Open incidents" : "Incidents"} question="What is happening?">
        {visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={CheckCircle}
              title="No open incidents"
              description="Nothing is currently degrading a business journey. Resolved incidents from this window are available under All."
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visible.map((incident) => (
              <IncidentImpactCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
}
