"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Target, Warning } from "@phosphor-icons/react/dist/ssr";
import type { BlastRadius } from "@/types";
import { useImpactAnalysis } from "@/hooks/use-impact";
import { useEntitySearch } from "@/hooks/use-graph";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact, BasisDetail } from "@/components/shared/revenue-impact";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { HealthDot } from "@/components/shared/health-badge";
import { CausalPath } from "@/components/shared/causal-path";
import { usePathNodes } from "@/components/shared/use-path-nodes";
import { BarChart } from "@/components/shared/charts/bar-chart";
import { EmptyState, ErrorState, LoadingCard, PartialDataNote } from "@/components/shared/states";
import { IMPACT_ORIGIN_SUGGESTIONS } from "@/lib/mock/impact";
import { classLabel } from "@/lib/ontology/classes";
import {
  formatCompactNumber,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

/** Opens on the entity with the widest blast radius in the demo estate. */
const DEFAULT_ORIGIN = "db-payments-primary";

const LAYER_LABEL = {
  business: "Business",
  experience: "Experience",
  application: "Application",
  platform: "Platform & data",
  infrastructure: "Infrastructure",
} as const;

/**
 * Blast radius analysis.
 *
 * The dependency structure is trace-observed, so the *set* of affected entities
 * is reliable. The customer and money figures scale current traffic into a
 * hypothetical, which the page states plainly rather than implying precision.
 */
export function ImpactView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const origin = params.get("origin") ?? DEFAULT_ORIGIN;
  const [scenario, setScenario] = React.useState<BlastRadius["scenario"]>("total-failure");
  const [term, setTerm] = React.useState("");

  const setOrigin = React.useCallback(
    (id: string) => {
      router.replace(`${pathname}?origin=${encodeURIComponent(id)}`, { scroll: false });
    },
    [pathname, router],
  );

  const { data: searchData } = useEntitySearch(term);
  const { data, isLoading, isError, error, refetch } = useImpactAnalysis(origin, scenario);
  const blastRadius = data?.data.blastRadius;
  const primaryPath = blastRadius?.paths[0];
  const pathNodes = usePathNodes(primaryPath);

  const byLayer = React.useMemo(() => {
    const groups = new Map<string, typeof blastRadius extends undefined ? never : NonNullable<typeof blastRadius>["entities"]>();
    for (const entity of blastRadius?.entities ?? []) {
      const list = groups.get(entity.layer) ?? [];
      list.push(entity);
      groups.set(entity.layer, list);
    }
    return groups;
  }, [blastRadius]);

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="If this fails, what breaks?"
        title="Impact Analysis"
        description="Pick any entity in the estate and model its failure. The graph walks every dependency that leads back to a customer-facing outcome."
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <label htmlFor="impact-origin" className="text-[12px] font-medium text-ink-secondary">
              Origin entity
            </label>
            <Input
              id="impact-origin"
              className="mt-1.5"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search for a service, database, application or network device"
            />
            {term.length >= 2 && (searchData?.data.length ?? 0) > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-surface-sunken p-1" data-slot="scroll-thin">
                {searchData?.data.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOrigin(node.id);
                        setTerm("");
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface"
                    >
                      <HealthDot health={node.health} />
                      <span className="min-w-0 flex-1 truncate text-ink">{node.label}</span>
                      <span className="shrink-0 text-[11.5px] text-ink-muted">
                        {classLabel(node.kind)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] text-ink-muted">Common origins</span>
              {IMPACT_ORIGIN_SUGGESTIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOrigin(id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[11.5px] transition-colors",
                    origin === id
                      ? "bg-accent text-on-accent"
                      : "bg-surface-sunken text-ink-secondary hover:bg-line hover:text-ink",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-[12px] font-medium text-ink-secondary">Scenario</p>
            <div className="mt-1.5">
              <Segmented<BlastRadius["scenario"]>
                label="Failure scenario"
                value={scenario}
                onChange={setScenario}
                options={(data?.data.alternatives ?? []).map((alt) => ({
                  value: alt.scenario,
                  label: alt.label,
                  hint: alt.description,
                }))}
              />
            </div>
            {data?.data.alternatives.find((a) => a.scenario === scenario) && (
              <p className="mt-2 max-w-xs text-[12px] text-ink-muted text-pretty">
                {data.data.alternatives.find((a) => a.scenario === scenario)?.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {isLoading && <LoadingCard lines={10} />}

      {isError && (
        <Card>
          <ErrorState
            description={error?.message ?? `No entity with id "${origin}" exists in the graph.`}
            onRetry={() => refetch()}
          />
        </Card>
      )}

      {blastRadius && (
        <>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="critical" size="md">
                    <Warning weight="fill" aria-hidden />
                    {blastRadius.scenarioLabel}
                  </Badge>
                  <Badge tone="outline">{classLabel(blastRadius.originKind as never)}</Badge>
                </div>
                <h2 className="mt-2.5 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                  {blastRadius.originLabel}
                </h2>
                <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
                  {blastRadius.entities.length} entities reachable, of which{" "}
                  {blastRadius.journeysAffected.length} are business journeys. Every figure below is
                  modelled — this is a scenario, so nothing here has been observed.
                </p>
              </div>
              <ConfidenceBadge confidence={blastRadius.confidence} />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Customers affected"
                value={formatNumber(blastRadius.impact.customersAffected)}
                footnote={`${formatPercent(blastRadius.impact.customersAffectedPct, 2)} of active customers`}
                emphasis="critical"
              />
              <StatTile
                label="Transactions at risk"
                value={formatCompactNumber(blastRadius.impact.transactionsAtRisk)}
                footnote="Per hour of failure"
              />
              <RevenueImpact
                label="Value at risk"
                money={blastRadius.impact.estimatedValueAtRisk}
                basis={blastRadius.impact.basis}
                size="lg"
              />
              <StatTile
                label="Journeys affected"
                value={blastRadius.journeysAffected.length}
                footnote="Mission and business critical outcomes"
              />
            </div>

            <PartialDataNote availability={blastRadius.impact.availability} className="mt-5" />
          </Card>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <Section id="affected" title="What breaks" question="Which entities are reached?">
              <div className="space-y-4">
                {(["business", "application", "platform", "infrastructure"] as const).map((layer) => {
                  const entities = byLayer.get(layer) ?? [];
                  if (!entities.length) return null;
                  return (
                    <Card key={layer}>
                      <CardHeader>
                        <CardTitle>
                          {LAYER_LABEL[layer]} · {entities.length}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="divide-y divide-[var(--line)]">
                          {entities.slice(0, 10).map((entity) => (
                            <li key={entity.id} className="py-2.5 first:pt-0 last:pb-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <HealthDot health={entity.health} />
                                <span className="min-w-0 flex-1">
                                  {entity.href ? (
                                    <Link
                                      href={entity.href}
                                      className="block truncate text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
                                    >
                                      {entity.label}
                                    </Link>
                                  ) : (
                                    <span className="block truncate text-[13.5px] font-medium text-ink">
                                      {entity.label}
                                    </span>
                                  )}
                                  <span className="block truncate text-[11.5px] text-ink-muted">
                                    {entity.reason}
                                  </span>
                                </span>
                                <Badge tone="outline">{entity.distance} hop{entity.distance === 1 ? "" : "s"}</Badge>
                                <span className="w-16 shrink-0 text-right text-[12.5px] tabular text-ink">
                                  {formatCompactNumber(entity.customersAffected)}
                                </span>
                                {entity.valueAtRisk && (
                                  <span className="w-16 shrink-0 text-right text-[12.5px] tabular text-ink-secondary">
                                    {formatMoneyCompact(entity.valueAtRisk)}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                          {entities.length > 10 && (
                            <li className="pt-2.5 text-[11.5px] text-ink-muted">
                              +{entities.length - 10} more not listed
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </Section>

            <div className="space-y-4">
              <Card className="p-4 sm:p-5">
                <BarChart
                  title="Customers affected by entity"
                  subtitle="Top reached entities, ordered by modelled customer impact"
                  valueLabel="Customers affected"
                  rows={[...blastRadius.entities]
                    .sort((a, b) => b.customersAffected - a.customersAffected)
                    .slice(0, 8)
                    .map((entity) => ({
                      id: entity.id,
                      label: entity.label,
                      value: entity.customersAffected,
                      display: formatCompactNumber(entity.customersAffected),
                      tone:
                        entity.layer === "business"
                          ? "critical"
                          : entity.layer === "application"
                            ? "serious"
                            : "series",
                      meta: `${entity.distance} hop${entity.distance === 1 ? "" : "s"} · ${classLabel(entity.kind as never)}`,
                    }))}
                />
              </Card>

              {primaryPath && pathNodes.length > 0 && (
                <Card className="p-4 sm:p-5">
                  <CausalPath path={primaryPath} nodes={pathNodes} title="Dependency path" />
                </Card>
              )}

              <Card className="p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  How the impact figure was calculated
                </p>
                <div className="mt-3">
                  <BasisDetail basis={blastRadius.impact.basis} />
                </div>
              </Card>
            </div>
          </div>

          {blastRadius.entities.length === 0 && (
            <Card>
              <EmptyState
                icon={Target}
                title="Nothing downstream depends on this"
                description="No entity in the graph reaches a customer-facing outcome through this one. That may mean it is genuinely isolated, or that its dependencies have not been observed carrying traffic."
              />
            </Card>
          )}

          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-ink-secondary text-pretty">
                Want the same analysis in prose, with evidence?
              </p>
              <Link
                href={`/ask?q=${encodeURIComponent(`If ${blastRadius.originLabel} fails, which business journeys are affected?`)}`}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-hover"
              >
                Ask APPX
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
