"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkle, UserCheck } from "@phosphor-icons/react/dist/ssr";
import { useJourneys } from "@/hooks/use-journeys";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { JourneyHealthCard } from "./journey-health-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { ErrorState, LoadingGrid } from "@/components/shared/states";
import { formatCompactNumber, formatDate, formatPercent } from "@/lib/formatters";
import { isUnhealthy } from "@/lib/calculations/health";

type Filter = "all" | "breaking" | "governed" | "proposed";

/**
 * The journey portfolio.
 *
 * Discovery is hybrid by design: the platform proposes journeys from
 * transaction and trace evidence, and a business owner validates, names and
 * governs them. Proposed journeys are shown separately and are never counted in
 * the health figures until someone owns them.
 */
export function JourneysView() {
  const { data, isLoading, isError, error, refetch } = useJourneys();
  const [filter, setFilter] = React.useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell width="wide" className="space-y-8">
        <LoadingGrid count={6} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell width="wide" className="space-y-8">
        <ErrorState
          description={error?.message ?? "The journey portfolio could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { journeys, proposed, portfolio } = data.data;
  const breaking = journeys.filter((j) => isUnhealthy(j.health));

  const visible =
    filter === "breaking"
      ? breaking
      : filter === "governed"
        ? journeys.filter((j) => j.discovery.state === "governed")
        : filter === "proposed"
          ? proposed
          : journeys;

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="Which customer journeys are breaking?"
        title="Journeys"
        description="The outcomes customers are trying to achieve, discovered from transaction and trace evidence, then validated and governed by their business owners."
        actions={
          <Segmented<Filter>
            label="Filter journeys"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${journeys.length}` },
              { value: "breaking", label: `Breaking ${breaking.length}` },
              { value: "governed", label: `Governed ${portfolio.governed}` },
              { value: "proposed", label: `Proposed ${portfolio.proposed}` },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Journeys in the portfolio"
            value={portfolio.total}
            footnote={`${portfolio.governed} governed · ${portfolio.validated} validated`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Breaching their SLO"
            value={portfolio.breaching}
            emphasis={portfolio.breaching > 0 ? "critical" : "default"}
            footnote="Success rate below target"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatCompactNumber(
              journeys.reduce((sum, j) => sum + j.customersAffected, 0),
            )}
            footnote="Across all degraded journeys"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Awaiting validation"
            value={portfolio.proposed}
            footnote="Proposed by discovery, no owner yet"
          />
        </Card>
      </div>

      {filter !== "proposed" && (
        <Section
          id="portfolio"
          title={filter === "breaking" ? "Breaking journeys" : "Journey portfolio"}
          question="How is each journey performing?"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((journey) => (
              <JourneyHealthCard key={journey.id} journey={journey} />
            ))}
          </div>
        </Section>
      )}

      {(filter === "all" || filter === "proposed") && proposed.length > 0 && (
        <Section
          id="discovery"
          title="Proposed by discovery"
          question="What has the platform found that nobody owns yet?"
          description="Automatically discovered from transaction volume and trace shape. A business owner validates the boundary, names it, assigns criticality and sets an SLO."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {proposed.map((journey) => (
              <Card key={journey.id} className="min-w-0">
                <CardHeader>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="accent">
                        <Sparkle weight="fill" aria-hidden />
                        Proposed
                      </Badge>
                      <span className="text-[11.5px] text-ink-muted">
                        Discovered {formatDate(journey.discovery.discoveredAt)} by{" "}
                        {journey.discovery.method.replace("-", " ")}
                      </span>
                    </div>
                    <CardTitle className="mt-2">{journey.name}</CardTitle>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary text-pretty">
                      {journey.businessDescription}
                    </p>
                  </div>
                  <ConfidenceBadge confidence={journey.discovery.confidence} />
                </CardHeader>

                <CardContent>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                    Why the platform proposed this
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {journey.discovery.signals.map((signal) => (
                      <li key={signal} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-secondary">
                        <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-muted" />
                        <span className="text-pretty">{signal}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-surface-sunken p-3">
                    <div>
                      <dt className="text-[11px] text-ink-muted">Customers</dt>
                      <dd className="text-[14px] font-semibold tabular text-ink">
                        {formatCompactNumber(journey.customersInWindow)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-ink-muted">Success rate</dt>
                      <dd className="text-[14px] font-semibold tabular text-ink">
                        {formatPercent(journey.successRatePct)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-ink-muted">Steps</dt>
                      <dd className="text-[14px] font-semibold tabular text-ink">
                        {journey.steps.length}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="sm">
                      <UserCheck />
                      Validate and assign an owner
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/journeys/${journey.id}`}>
                        Inspect
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-muted">
                    Governance actions are represented but not wired up in this phase.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </PageShell>
  );
}
