"use client";

import type { Evidence } from "@/types";
import {
  formatDateTime,
  formatNumber,
  formatSignedPercent,
  formatUnit,
} from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";

const KIND_LABEL: Record<Evidence["kind"], string> = {
  metric: "Metric",
  log: "Log",
  trace: "Trace",
  event: "Event",
  "change-record": "Change record",
  transaction: "Transaction",
  "revenue-record": "Revenue record",
  "config-snapshot": "Configuration",
  "graph-assertion": "Graph assertion",
  correlation: "Correlation",
};

/**
 * One evidence record, rendered identically wherever it appears — the drawer,
 * the evidence explorer and an Ask answer all use this, so a fact looks the
 * same everywhere it is cited.
 */
export function EvidenceCard({
  evidence,
  active,
  onSelect,
  compact,
}: {
  evidence: Evidence;
  active?: boolean;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const measurement = evidence.measurement;

  return (
    <article
      id={`evidence-${evidence.id}`}
      className={cn(
        "rounded-card bg-surface p-3.5 transition-shadow",
        active ? "ring-2 ring-accent" : "ring-hairline",
        onSelect && "cursor-pointer hover:shadow-sm",
      )}
      onClick={onSelect ? () => onSelect(evidence.id) : undefined}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-[5px] bg-accent-soft px-1 text-[11px] font-semibold text-accent-ink">
          {evidence.handle}
        </span>
        <ProvenanceBadge provenance={evidence.provenance} />
        <Badge tone="outline">{KIND_LABEL[evidence.kind]}</Badge>
        <span className="ml-auto text-[11px] tabular text-ink-muted">
          {formatDateTime(evidence.observedAt)}
        </span>
      </header>

      <h4 className="mt-2.5 text-[13.5px] font-semibold leading-snug text-ink">{evidence.title}</h4>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary text-pretty">
        {evidence.statement}
      </p>

      {measurement && (
        <dl className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-lg bg-surface-sunken px-3 py-2">
          <div>
            <dt className="text-[11px] text-ink-muted">{measurement.label}</dt>
            <dd className="text-[15px] font-semibold tabular text-ink">
              {formatUnit(measurement.value, measurement.unit)}
            </dd>
          </div>
          {measurement.baseline !== undefined && (
            <div>
              <dt className="text-[11px] text-ink-muted">Baseline</dt>
              <dd className="text-[13px] tabular text-ink-secondary">
                {formatUnit(measurement.baseline, measurement.unit)}
              </dd>
            </div>
          )}
          {measurement.deltaPct !== undefined && (
            <div>
              <dt className="text-[11px] text-ink-muted">Change</dt>
              <dd
                className={cn(
                  "text-[13px] font-medium tabular",
                  measurement.deltaPct > 0 ? "text-critical-ink" : "text-good-ink",
                )}
              >
                {formatSignedPercent(measurement.deltaPct)}
              </dd>
            </div>
          )}
        </dl>
      )}

      {evidence.assertion && (
        <p className="mt-3 overflow-x-auto rounded-lg bg-surface-sunken px-3 py-2 font-mono text-[11.5px] text-ink-secondary" data-slot="scroll-thin">
          <span className="text-ink">{evidence.assertion.subject}</span>{" "}
          <span className="text-accent-ink">{evidence.assertion.predicate}</span>{" "}
          <span className="text-ink">{evidence.assertion.object}</span>
        </p>
      )}

      {evidence.excerpt && !compact && (
        <pre
          className="mt-3 overflow-x-auto rounded-lg bg-surface-sunken px-3 py-2 font-mono text-[11.5px] leading-relaxed text-ink-secondary"
          data-slot="scroll-thin"
        >
          {evidence.excerpt}
        </pre>
      )}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 hairline-t pt-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="font-medium text-ink-secondary">{evidence.source.system}</span>
          <span aria-hidden>·</span>
          <span className="truncate font-mono">{evidence.source.reference}</span>
          <span aria-hidden>·</span>
          <span>
            {evidence.source.latencySeconds < 120
              ? `${evidence.source.latencySeconds}s behind`
              : `${formatNumber(evidence.source.latencySeconds / 60)} min behind`}
          </span>
        </div>
        {evidence.confidence && <ConfidenceBadge confidence={evidence.confidence} />}
      </footer>
    </article>
  );
}
