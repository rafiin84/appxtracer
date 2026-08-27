"use client";

import { CheckCircle, Warning, XCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useShapeReports, useSources } from "@/hooks/use-executive";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/progress";
import { StatTile } from "@/components/shared/stat-tile";
import { ErrorState, LoadingCard } from "@/components/shared/states";
import { ONTOLOGY_CLASSES, PREDICATES, SHAPES } from "@/lib/ontology";
import { ENVIRONMENTS } from "@/lib/mock/company";
import { PERSONAS } from "@/stores/app-store";
import { formatCompactNumber, formatNumber, formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

const STATUS = {
  connected: { tone: "good", icon: CheckCircle, label: "Connected" },
  degraded: { tone: "warning", icon: Warning, label: "Degraded" },
  disconnected: { tone: "critical", icon: XCircle, label: "Disconnected" },
} as const;

/**
 * Administration.
 *
 * Two things a buyer asks in the first meeting: what does it connect to, and
 * how do I know the model is right? This screen answers both — the ingest
 * estate, and live SHACL conformance over the actual dataset.
 */
export function AdministrationView() {
  const { data: sourcesData, isLoading: sourcesLoading, isError, error, refetch } = useSources();
  const { data: shapesData } = useShapeReports();

  if (sourcesLoading) {
    return (
      <PageShell>
        <LoadingCard lines={10} />
      </PageShell>
    );
  }

  if (isError || !sourcesData) {
    return (
      <PageShell>
        <ErrorState
          description={error?.message ?? "Administration data could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const sources = sourcesData.data;
  const shapes = shapesData?.data ?? [];
  const totalEntities = sources.reduce((sum, s) => sum + s.entitiesContributed, 0);
  const totalFacts = sources.reduce((sum, s) => sum + s.factsContributed, 0);
  const violations = shapes.reduce((sum, s) => sum + (s.severity === "violation" ? s.violating : 0), 0);
  const warnings = shapes.reduce((sum, s) => sum + (s.severity === "warning" ? s.violating : 0), 0);

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="What is connected, and is the model healthy?"
        title="Administration"
        description="APPX Tracer sits above the observability estate. These systems are the sensors; the semantic layer connects what they know."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Connected sources"
            value={sources.filter((s) => s.status === "connected").length}
            footnote={`of ${sources.length} configured`}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile label="Entities in the graph" value={formatCompactNumber(totalEntities)} />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile label="Facts ingested" value={formatCompactNumber(totalFacts)} footnote="Across all sources" />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Shape violations"
            value={violations}
            emphasis={violations > 0 ? "critical" : "default"}
            footnote={`${warnings} warnings`}
          />
        </Card>
      </div>

      <Section
        id="sources"
        title="Data sources"
        question="Where does the model get its facts?"
        description="Existing tools are not replaced. Each contributes entities and facts, and each declares how far behind it is."
      >
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <div className="overflow-x-auto" data-slot="scroll-thin">
              <table className="w-full min-w-[46rem] border-collapse text-[12.5px]">
                <caption className="sr-only">Connected data sources</caption>
                <thead>
                  <tr>
                    {["Source", "Category", "Status", "Entities", "Facts", "Freshness", "Last sync"].map(
                      (column, i) => (
                        <th
                          key={column}
                          scope="col"
                          className={cn(
                            "hairline-b px-2 py-2 font-medium text-ink-muted",
                            i < 3 ? "text-left" : "text-right",
                          )}
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => {
                    const status = STATUS[source.status];
                    const Icon = status.icon;
                    return (
                      <tr key={source.id}>
                        <th scope="row" className="px-2 py-2.5 text-left font-medium text-ink">
                          {source.system}
                        </th>
                        <td className="px-2 py-2.5 text-ink-secondary">{source.category}</td>
                        <td className="px-2 py-2.5">
                          <Badge tone={status.tone}>
                            <Icon weight="fill" aria-hidden />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular text-ink">
                          {formatNumber(source.entitiesContributed)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular text-ink">
                          {formatCompactNumber(source.factsContributed)}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-2.5 text-right tabular",
                            source.latencySeconds > 600 ? "text-critical-ink" : "text-ink-secondary",
                          )}
                        >
                          {source.latencySeconds < 120
                            ? `${source.latencySeconds}s`
                            : `${Math.round(source.latencySeconds / 60)} min`}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular text-ink-muted">
                          {formatRelative(source.lastSyncAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section
        id="shapes"
        title="Model quality"
        question="Can I trust what the graph asserts?"
        description="SHACL shapes run against the live dataset. These are real results — proposed journeys genuinely have no owner and no SLO, which is exactly the governance gap the Journeys screen asks a business owner to close."
      >
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <ul className="divide-y divide-[var(--line)]">
              {shapes.map((report) => {
                const shape = SHAPES.find((s) => s.id === report.shapeId);
                const total = report.conforming + report.violating;
                const conformance = total > 0 ? (report.conforming / total) * 100 : 100;
                return (
                  <li key={report.shapeId} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-ink">{report.label}</p>
                        {shape && (
                          <p className="mt-0.5 text-[12px] text-ink-secondary text-pretty">
                            {shape.description}
                          </p>
                        )}
                        <p className="mt-1 overflow-x-auto font-mono text-[11px] text-ink-muted" data-slot="scroll-thin">
                          {shape?.rule}
                        </p>
                      </div>
                      <Badge tone={report.violating === 0 ? "good" : report.severity === "violation" ? "critical" : "warning"}>
                        {report.violating === 0
                          ? "Conforms"
                          : `${report.violating} ${report.severity === "violation" ? "violations" : "warnings"}`}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Meter
                        className="flex-1"
                        value={conformance}
                        tone={report.violating === 0 ? "good" : report.severity === "violation" ? "critical" : "warning"}
                        label={`${report.label} conformance`}
                      />
                      <span className="shrink-0 text-[11.5px] tabular text-ink-muted">
                        {report.conforming}/{total}
                      </span>
                    </div>
                    {report.violatingIds.length > 0 && (
                      <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
                        {report.violatingIds.slice(0, 6).join(" · ")}
                        {report.violatingIds.length > 6 ? ` · +${report.violatingIds.length - 6} more` : ""}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="ontology" title="Ontology" question="What does the model know how to describe?">
          <Card>
            <CardHeader>
              <CardTitle>
                {ONTOLOGY_CLASSES.length} classes · {PREDICATES.length} predicates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-relaxed text-ink-secondary text-pretty">
                Classes form an RDFS hierarchy — a Firewall is a NetworkDevice, a PaymentService is a
                Service, Checkout is a BusinessJourney. Predicates carry OWL characteristics, which is
                what lets the graph answer questions nobody asserted directly: because{" "}
                <span className="font-mono text-[12px] text-ink">dependsOn</span> is transitive, the
                closure from a database reaches every journey above it.
              </p>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Transitive and symmetric predicates
                </p>
                <ul className="mt-2 space-y-1.5">
                  {PREDICATES.filter((p) => p.transitive || p.symmetric).map((predicate) => (
                    <li key={predicate.predicate} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                      <span className="font-mono text-ink">{predicate.curie}</span>
                      {predicate.transitive && <Badge tone="outline">transitive</Badge>}
                      {predicate.symmetric && <Badge tone="outline">symmetric</Badge>}
                      <span className="min-w-0 flex-1 truncate text-ink-muted">
                        inverse: {predicate.inverseLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section id="governance" title="Access and privacy" question="Who can see what?">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-ink-muted" weight="fill" aria-hidden />
                <CardTitle>Tenants, scopes and audit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Environments
                </p>
                <ul className="mt-2 space-y-1.5">
                  {ENVIRONMENTS.map((environment) => (
                    <li key={environment.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-ink">{environment.name}</span>
                      <span className="font-mono text-[11.5px] text-ink-muted">{environment.tenant}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                  Personas
                </p>
                <ul className="mt-2 space-y-1.5">
                  {PERSONAS.map((persona) => (
                    <li key={persona.id} className="text-[12.5px]">
                      <span className="font-medium text-ink">{persona.label}</span>
                      <span className="text-ink-muted"> — {persona.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-lg bg-surface-sunken px-3 py-2.5 text-[12px] leading-relaxed text-ink-secondary text-pretty">
                Customer identifiers are masked unless the viewer holds the{" "}
                <span className="font-mono text-[11.5px] text-ink">customer.pii.read</span> scope, and
                every unmasking is written to the audit trail with the viewer, the identifier used and
                the time. Phase 1 implements no authentication — these controls are modelled so they
                are not retrofitted later.
              </p>
            </CardContent>
          </Card>
        </Section>
      </div>
    </PageShell>
  );
}
