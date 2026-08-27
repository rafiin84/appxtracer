"use client";

import Link from "next/link";
import { ArrowRight, Clock, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { useIncidentContext } from "@/hooks/use-incidents";
import { useJourneys } from "@/hooks/use-journeys";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityBadge, HealthDot } from "@/components/shared/health-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact, BasisDetail } from "@/components/shared/revenue-impact";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { CausalPath } from "@/components/shared/causal-path";
import { usePathNodes } from "@/components/shared/use-path-nodes";
import { IncidentTimeline } from "./incident-timeline";
import { ChangeCorrelationCard } from "@/components/changes/change-correlation";
import { RecommendedActions } from "@/components/command-center/recommended-actions";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { ErrorState, LoadingCard, PartialDataNote } from "@/components/shared/states";
import {
  formatCompactNumber,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";

const STATE_LABEL = {
  investigating: "Investigating",
  identified: "Cause identified",
  mitigating: "Mitigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
} as const;

export function IncidentDetailView({ incidentId }: { incidentId: string }) {
  const { data, isLoading, isError, error, refetch } = useIncidentContext(incidentId);
  const { data: journeysData } = useJourneys();
  const path = data?.data.path;
  const pathNodes = usePathNodes(path);

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
          title="Incident not found"
          description={error?.message ?? `No incident matches "${incidentId}".`}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const { incident, rootCause, recommendations, changes, evidence, impact } = data.data;
  const allJourneys = [
    ...(journeysData?.data.journeys ?? []),
    ...(journeysData?.data.proposed ?? []),
  ];
  const journeys = allJourneys.filter((j) => incident.journeyIds.includes(j.id));

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        back={{ href: "/incidents", label: "All incidents" }}
        question="What is the business impact, and why is it happening?"
        title={incident.title}
        description={incident.businessSummary}
        meta={
          <>
            <SeverityBadge severity={incident.severity} size="md" />
            <Badge tone={incident.state === "resolved" ? "good" : "accent"} size="md">
              {STATE_LABEL[incident.state]}
            </Badge>
            <span className="font-mono text-[12px] text-ink-muted">{incident.reference}</span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-secondary">
              <UserCircle className="size-4 text-ink-muted" aria-hidden />
              {incident.owner.name} · {incident.owner.team}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
              <Clock className="size-3.5" aria-hidden />
              Started {formatRelative(incident.startedAt)} · detected{" "}
              {formatDateTime(incident.detectedAt)}
            </span>
          </>
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/ask?q=${encodeURIComponent(`Why is ${incident.title.toLowerCase()}?`)}`}>
              Ask APPX
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Customers affected"
            value={formatNumber(incident.customersAffected)}
            footnote={`${formatPercent(incident.customersAffectedPct, 2)} of active customers`}
            emphasis="critical"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Transactions failed"
            value={formatCompactNumber(incident.transactionsFailed)}
            footnote={`${formatCompactNumber(impact.transactionsAtRisk)} at risk in total`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact
            label="Value at risk"
            money={impact.estimatedValueAtRisk}
            basis={impact.basis}
            size="lg"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          {incident.observedValueLost ? (
            <RevenueImpact
              label="Observed value lost"
              money={incident.observedValueLost}
              size="lg"
              exact
            />
          ) : (
            <StatTile
              label="Observed value lost"
              value="None recorded"
              emphasis="quiet"
              footnote="No settled loss attributable to this incident"
            />
          )}
        </Card>
      </div>

      <PartialDataNote availability={impact.availability} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {rootCause && (
          <Card className="min-w-0">
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Why is this happening?</CardTitle>
                <p className="mt-1 text-[12.5px] text-ink-secondary">
                  {rootCause.entityLabel} · first observed {formatRelative(rootCause.firstObservedAt)}
                </p>
              </div>
              <ConfidenceBadge confidence={rootCause.confidence} />
            </CardHeader>
            <CardContent>
              <div className="mb-2.5">
                <ProvenanceBadge provenance={rootCause.provenance} />
              </div>
              <h3 className="text-[15.5px] font-semibold leading-snug text-ink text-balance">
                {rootCause.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
                {rootCause.statement}
              </p>
              <div className="mt-3">
                <EvidenceHandles ids={rootCause.evidenceIds} title={rootCause.title} />
              </div>

              {rootCause.contributingFactors.length > 0 && (
                <>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                    Contributing factors
                  </p>
                  <ul className="mt-2 space-y-2.5">
                    {rootCause.contributingFactors.map((factor) => (
                      <li key={factor.id} className="rounded-lg bg-surface-sunken p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 text-[13px] font-medium text-ink">{factor.title}</p>
                          <ConfidenceBadge confidence={factor.confidence} />
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary text-pretty">
                          {factor.statement}
                        </p>
                        <div className="mt-1.5">
                          <EvidenceHandles ids={factor.evidenceIds} title={factor.title} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {path && pathNodes.length > 0 && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Impact chain</CardTitle>
            </CardHeader>
            <CardContent>
              <CausalPath path={path} nodes={pathNodes} title="Customer to cause" />
            </CardContent>
          </Card>
        )}
      </div>

      <Section id="timeline" title="Timeline" question="What happened, in order?">
        <Card className="p-4 sm:p-6">
          <IncidentTimeline entries={incident.timeline} />
        </Card>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="journeys" title="Journeys affected" question="What business outcomes are hit?">
          <Card>
            <CardContent className="pt-4 sm:pt-5">
              <ul className="divide-y divide-[var(--line)]">
                {journeys.map((journey) => (
                  <li key={journey.id}>
                    <Link
                      href={`/journeys/${journey.id}`}
                      className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:text-accent"
                    >
                      <HealthDot health={journey.health} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">
                          {journey.name}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-muted">
                          {formatCompactNumber(journey.customersAffected)} affected ·{" "}
                          {formatPercent(journey.successRatePct)} success
                        </span>
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>

        <Section id="basis" title="How the impact figure was calculated" question="Why this number?">
          <Card className="p-4 sm:p-5">
            <BasisDetail basis={impact.basis} />
          </Card>
        </Section>
      </div>

      {changes.length > 0 && (
        <Section id="changes" title="What changed before this" question="What changed?">
          <div className="grid gap-4 lg:grid-cols-2">
            {changes.map((change) => (
              <ChangeCorrelationCard key={change.id} change={change} />
            ))}
          </div>
        </Section>
      )}

      {recommendations.length > 0 && (
        <Section id="actions" title="Recommended actions" question="What should I do now?">
          <RecommendedActions recommendations={recommendations} />
        </Section>
      )}

      <Section
        id="evidence"
        title="Evidence"
        question="What is every claim built on?"
        description={`${evidence.length} records from ${new Set(evidence.map((e) => e.source.system)).size} systems.`}
      >
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {evidence.map((record) => (
            <EvidenceCard key={record.id} evidence={record} compact />
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
