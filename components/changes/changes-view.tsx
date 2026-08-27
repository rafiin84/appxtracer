"use client";

import * as React from "react";
import { useChanges } from "@/hooks/use-changes";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { StatTile } from "@/components/shared/stat-tile";
import { ChangeCorrelationCard } from "./change-correlation";
import { EmptyState, ErrorState, LoadingGrid } from "@/components/shared/states";
import { formatDate, formatPercent } from "@/lib/formatters";

type Filter = "all" | "correlated" | "high-risk" | "rolled-back";

/**
 * Change is the single most common precursor to degradation, so this screen is
 * organised around correlation rather than chronology alone: correlated changes
 * surface first, each stating its lead time and its confidence.
 */
export function ChangesView() {
  const { data, isLoading, isError, error, refetch } = useChanges();
  const [filter, setFilter] = React.useState<Filter>("all");

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
          description={error?.message ?? "The change record could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { changes, summary } = data.data;
  const visible =
    filter === "correlated"
      ? changes.filter((c) => c.correlation)
      : filter === "high-risk"
        ? changes.filter((c) => c.risk === "high")
        : filter === "rolled-back"
          ? changes.filter((c) => c.rolledBack)
          : changes;

  const byDay = visible.reduce<Record<string, typeof changes>>((acc, change) => {
    const day = formatDate(change.at);
    (acc[day] ??= []).push(change);
    return acc;
  }, {});

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="What changed before things went wrong?"
        title="Changes"
        description="Deployments, configuration, infrastructure, network and security changes from every system of record, correlated against observed degradation."
        actions={
          <Segmented<Filter>
            label="Filter changes"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${summary.total}` },
              { value: "correlated", label: `Correlated ${summary.correlated}` },
              { value: "high-risk", label: `High risk ${summary.highRisk}` },
              { value: "rolled-back", label: `Rolled back ${summary.rolledBack}` },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile label="Changes in window" value={summary.total} />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Correlated with degradation"
            value={summary.correlated}
            emphasis={summary.correlated > 0 ? "critical" : "default"}
            footnote={`${formatPercent((summary.correlated / Math.max(1, summary.total)) * 100, 0)} of changes`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile label="High risk" value={summary.highRisk} />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Rolled back"
            value={summary.rolledBack}
            footnote="Reverted after a correlated effect"
          />
        </Card>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="No changes match that filter"
            description="Try widening the time window, or clear the filter to see every change in the record."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(byDay).map(([day, dayChanges]) => (
            <Section key={day} id={`day-${day}`} title={day} question={`${dayChanges.length} changes`}>
              <div className="grid gap-4 lg:grid-cols-2">
                {dayChanges.map((change) => (
                  <ChangeCorrelationCard key={change.id} change={change} />
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
