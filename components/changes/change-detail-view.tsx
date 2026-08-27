"use client";

import Link from "next/link";
import { ArrowRight, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { useChange } from "@/hooks/use-changes";
import { useEntityIndex } from "@/hooks/use-graph";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { HealthDot } from "@/components/shared/health-badge";
import { ErrorState, LoadingCard } from "@/components/shared/states";
import { formatDateTime, formatDurationMinutes, formatRelative } from "@/lib/formatters";

const RISK_TONE = { low: "neutral", medium: "warning", high: "serious" } as const;

export function ChangeDetailView({ changeId }: { changeId: string }) {
  const { data, isLoading, isError, error, refetch } = useChange(changeId);
  const { data: indexData } = useEntityIndex();
  const index = indexData?.data ?? {};

  if (isLoading) {
    return (
      <PageShell className="space-y-8">
        <LoadingCard lines={8} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell className="space-y-8">
        <ErrorState
          title="Change not found"
          description={error?.message ?? `No change matches "${changeId}".`}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const change = data.data;
  const targets = [
    ...new Set([...change.targetIds, ...change.serviceIds, ...change.infrastructureIds, ...change.applicationIds]),
  ];

  return (
    <PageShell className="space-y-8">
      <PageHeader
        back={{ href: "/changes", label: "All changes" }}
        question="What did this change do?"
        title={change.title}
        description={change.summary}
        meta={
          <>
            <Badge tone="outline" size="md">
              {change.kind.replace("-", " ")}
            </Badge>
            <Badge tone={RISK_TONE[change.risk]} size="md">
              {change.risk} risk
            </Badge>
            {change.rolledBack && (
              <Badge tone="neutral" size="md">
                <ArrowCounterClockwise aria-hidden />
                Rolled back {change.rolledBackAt ? formatRelative(change.rolledBackAt) : ""}
              </Badge>
            )}
            <span className="font-mono text-[12px] text-ink-muted">{change.reference}</span>
            <span className="text-[12.5px] text-ink-secondary">
              {change.actorTeam} · {formatDateTime(change.at)}
            </span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>What it did</CardTitle>
            <ProvenanceBadge provenance="observed" />
          </CardHeader>
          <CardContent>
            <p className="text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
              {change.detail}
            </p>

            {change.approvedBy && (
              <p className="mt-4 text-[12.5px] text-ink-muted">
                Approved by {change.approvedBy.name}, {change.approvedBy.role}
              </p>
            )}
            <p className="mt-1 text-[12.5px] text-ink-muted">Source of record: {change.source}</p>

            {change.evidenceIds.length > 0 && (
              <div className="mt-4 hairline-t pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Evidence
                </p>
                <div className="mt-1.5">
                  <EvidenceHandles ids={change.evidenceIds} title={change.reference} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {change.correlation ? (
          <Card className="min-w-0 ring-1 ring-serious/30">
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Correlated with degradation</CardTitle>
                <p className="mt-0.5 text-[12px] text-ink-secondary">
                  Correlation, not proof of causation — the graph states what it observed.
                </p>
              </div>
              <ConfidenceBadge confidence={change.correlation.confidence} />
            </CardHeader>
            <CardContent>
              <p className="text-[13.5px] leading-relaxed text-ink text-pretty">
                {change.correlation.observedEffect}
              </p>

              <dl className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Lead time to first symptom</dt>
                  <dd className="font-medium tabular text-ink">
                    {formatDurationMinutes(change.correlation.leadTimeMinutes)}
                  </dd>
                </div>
                {change.correlation.incidentId && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">Incident</dt>
                    <dd>
                      <Link
                        href={`/incidents/${change.correlation.incidentId}`}
                        className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover"
                      >
                        {change.correlation.incidentId}
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              {change.correlation.journeyIds.length > 0 && (
                <div className="mt-4 hairline-t pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                    Journeys affected
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {change.correlation.journeyIds.map((id) => (
                      <li key={id}>
                        <Link
                          href={`/journeys/${id}`}
                          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-ink transition-colors hover:bg-surface-sunken"
                        >
                          <span className="min-w-0 flex-1 truncate">{index[id]?.label ?? id}</span>
                          <ArrowRight className="size-3 shrink-0 text-ink-muted" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>No correlated degradation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
                Nothing in this change&apos;s topological neighbourhood degraded within the
                correlation window. That is a real finding, not an absence of data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Section id="targets" title="Entities changed" question="What did it touch?">
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <ul className="divide-y divide-[var(--line)]">
              {targets.map((id) => {
                const entry = index[id];
                return (
                  <li key={id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      {entry && <HealthDot health={entry.health as never} />}
                      <span className="min-w-0 flex-1">
                        {entry?.href ? (
                          <Link
                            href={entry.href}
                            className="block truncate text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
                          >
                            {entry.label}
                          </Link>
                        ) : (
                          <span className="block truncate text-[13.5px] font-medium text-ink">
                            {entry?.label ?? id}
                          </span>
                        )}
                        <span className="block truncate font-mono text-[11.5px] text-ink-muted">{id}</span>
                      </span>
                      <Link
                        href={`/digital-map?focus=${id}`}
                        className="shrink-0 text-[12px] font-medium text-accent hover:text-accent-hover"
                      >
                        Show on map
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}
