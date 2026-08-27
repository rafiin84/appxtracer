"use client";

import * as React from "react";
import type { Evidence, Provenance } from "@/types";
import { useEvidenceCorpus } from "@/hooks/use-evidence";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/shared/stat-tile";
import { ProvenanceLegend } from "@/components/shared/provenance";
import { EvidenceCard } from "./evidence-card";
import { EmptyState, ErrorState, LoadingCard } from "@/components/shared/states";
import { PROVENANCE_LABEL } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

const KIND_LABEL: Record<Evidence["kind"], string> = {
  metric: "Metrics",
  log: "Logs",
  trace: "Traces",
  event: "Events",
  "change-record": "Change records",
  transaction: "Transactions",
  "revenue-record": "Revenue records",
  "config-snapshot": "Configuration",
  "graph-assertion": "Graph assertions",
  correlation: "Correlations",
};

/**
 * The evidence explorer.
 *
 * Every claim the product makes anywhere resolves to a record in here. Making
 * that corpus browsable is the point: a CIO who can audit one number learns to
 * trust the rest.
 */
export function EvidenceView() {
  const { data, isLoading, isError, error, refetch } = useEvidenceCorpus();
  const [term, setTerm] = React.useState("");
  const [provenance, setProvenance] = React.useState<Provenance[]>([]);
  const [kinds, setKinds] = React.useState<Evidence["kind"][]>([]);
  const [sources, setSources] = React.useState<string[]>([]);

  if (isLoading) {
    return (
      <PageShell width="wide" className="space-y-8">
        <LoadingCard lines={10} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell width="wide" className="space-y-8">
        <ErrorState
          description={error?.message ?? "The evidence corpus could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const corpus = data.data;
  const allSources = [...new Set(corpus.map((e) => e.source.system))].sort();
  const allKinds = [...new Set(corpus.map((e) => e.kind))];

  const visible = corpus.filter((record) => {
    if (provenance.length && !provenance.includes(record.provenance)) return false;
    if (kinds.length && !kinds.includes(record.kind)) return false;
    if (sources.length && !sources.includes(record.source.system)) return false;
    if (term) {
      const q = term.toLowerCase();
      if (
        !record.title.toLowerCase().includes(q) &&
        !record.statement.toLowerCase().includes(q) &&
        !record.handle.toLowerCase().includes(q) &&
        !record.subjectIds.some((id) => id.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  const counts = {
    observed: corpus.filter((e) => e.provenance === "observed").length,
    derived: corpus.filter((e) => e.provenance === "derived").length,
    interpreted: corpus.filter((e) => e.provenance === "interpreted").length,
  };

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="What is every claim built on?"
        title="Evidence"
        description="The full corpus of facts backing every number, causal claim and recommendation in the product. Each record carries its source, its timestamp and whether it was observed or derived."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile label="Evidence records" value={corpus.length} footnote={`${allSources.length} contributing systems`} />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile label="Observed" value={counts.observed} footnote="Read from a system of record" />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile label="Derived" value={counts.derived} footnote="Inference, correlation or calculation" />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Records with a confidence"
            value={corpus.filter((e) => e.confidence).length}
            footnote="Every derived record must carry one"
          />
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <label htmlFor="evidence-search" className="sr-only">
              Search evidence
            </label>
            <Input
              id="evidence-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search by handle, statement or entity"
            />
          </div>
          <ProvenanceLegend className="sm:ml-auto" />
        </div>

        <div className="mt-4 space-y-2 hairline-t pt-4">
          <FilterRow label="Provenance">
            {(["observed", "derived", "interpreted"] as Provenance[]).map((p) => (
              <Chip
                key={p}
                active={provenance.includes(p)}
                onClick={() =>
                  setProvenance(
                    provenance.includes(p) ? provenance.filter((x) => x !== p) : [...provenance, p],
                  )
                }
              >
                {PROVENANCE_LABEL[p]}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Kind">
            {allKinds.map((kind) => (
              <Chip
                key={kind}
                active={kinds.includes(kind)}
                onClick={() =>
                  setKinds(kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind])
                }
              >
                {KIND_LABEL[kind]}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Source">
            {allSources.map((source) => (
              <Chip
                key={source}
                active={sources.includes(source)}
                onClick={() =>
                  setSources(
                    sources.includes(source)
                      ? sources.filter((s) => s !== source)
                      : [...sources, source],
                  )
                }
              >
                {source}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </Card>

      <Section
        id="corpus"
        title="Records"
        question={`${visible.length} of ${corpus.length} records`}
      >
        {visible.length === 0 ? (
          <Card>
            <EmptyState
              title="No evidence matches those filters"
              description="Clear a filter or broaden the search. Every claim in the product resolves to at least one record here."
            />
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {visible.map((record) => (
              <EvidenceCard key={record.id} evidence={record} />
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-accent text-on-accent"
          : "bg-surface-sunken text-ink-secondary hover:bg-line hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
