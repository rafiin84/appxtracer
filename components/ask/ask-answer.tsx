"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CaretDown,
  Info,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { AskAnswer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { RevenueImpact, BasisDetail } from "@/components/shared/revenue-impact";
import { EvidenceHandle, EvidenceHandles } from "@/components/shared/evidence-handle";
import { CausalPath } from "@/components/shared/causal-path";
import { usePathNodes } from "@/components/shared/use-path-nodes";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { PartialDataNote } from "@/components/shared/states";
import { RecommendedActions } from "@/components/command-center/recommended-actions";
import {
  formatCompactNumber,
  formatDurationMs,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

/**
 * An Ask answer.
 *
 * The structure is fixed and always the same, which is the point: an executive
 * summary, the business impact, the cause, the evidence, the path, and what to
 * do — never a wall of prose. Every claim carries its citation.
 */
export function AskAnswerView({ answer, onFollowUp }: { answer: AskAnswer; onFollowUp: (q: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const pathNodes = usePathNodes(answer.path);
  const [showWorking, setShowWorking] = React.useState(false);

  const evidenceIds = answer.evidence.map((e) => e.id);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
              <Sparkle className="size-4" weight="fill" aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle>Answer</CardTitle>
              <p className="mt-0.5 text-[12px] text-ink-secondary">
                Grounded in {answer.evidence.length} evidence records from{" "}
                {new Set(answer.evidence.map((e) => e.source.system)).size} systems
              </p>
            </div>
          </div>
          <ConfidenceBadge confidence={answer.confidence} />
        </CardHeader>

        <CardContent>
          <p className="text-[15px] leading-[1.65] text-ink text-pretty">
            {answer.executiveSummary}
          </p>

          {answer.citations.length > 0 && (
            <div className="mt-4 rounded-lg bg-surface-sunken p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                What each claim rests on
              </p>
              <ul className="mt-2 space-y-1.5">
                {answer.citations.map((citation) => (
                  <li key={citation.evidenceId} className="flex gap-2 text-[12.5px] leading-relaxed">
                    <EvidenceHandle
                      handle={citation.handle}
                      evidenceId={citation.evidenceId}
                      bundle={evidenceIds}
                      title={answer.question}
                    />
                    <span className="min-w-0 text-ink-secondary text-pretty">{citation.claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {answer.limitations.length > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-surface-sunken px-3 py-2.5">
              <Info className="mt-px size-4 shrink-0 text-ink-muted" weight="fill" aria-hidden />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-ink">What this answer cannot establish</p>
                <ul className="mt-1 space-y-1">
                  {answer.limitations.map((limitation) => (
                    <li key={limitation} className="text-[12px] leading-relaxed text-ink-secondary text-pretty">
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {answer.impact && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Business impact</CardTitle>
            <ProvenanceBadge provenance="derived" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-[12px] font-medium text-ink-secondary">Customers affected</p>
                <p className="mt-1 text-2xl font-semibold tabular leading-none tracking-[-0.02em] text-ink">
                  {formatNumber(answer.impact.customersAffected)}
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-muted">
                  {formatPercent(answer.impact.customersAffectedPct, 2)} of active customers
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-ink-secondary">Transactions failed</p>
                <p className="mt-1 text-2xl font-semibold tabular leading-none tracking-[-0.02em] text-ink">
                  {formatCompactNumber(answer.impact.transactionsFailed)}
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-muted">
                  {formatCompactNumber(answer.impact.transactionsAtRisk)} at risk in total
                </p>
              </div>
              <RevenueImpact
                label="Value at risk"
                money={answer.impact.estimatedValueAtRisk}
                basis={answer.impact.basis}
                size="lg"
              />
              {answer.impact.observedValueLost && answer.impact.observedValueLost.amount > 0 ? (
                <RevenueImpact
                  label="Observed value lost"
                  money={answer.impact.observedValueLost}
                  size="lg"
                />
              ) : (
                <div>
                  <p className="text-[12px] font-medium text-ink-secondary">Conversion impact</p>
                  <p className="mt-1 text-2xl font-semibold tabular leading-none tracking-[-0.02em] text-ink">
                    {formatPercent(answer.impact.conversionImpactPct)}
                  </p>
                </div>
              )}
            </div>

            <PartialDataNote availability={answer.impact.availability} className="mt-4" />

            <details className="mt-4 rounded-lg bg-surface-sunken p-3">
              <summary className="cursor-pointer text-[12.5px] font-medium text-ink">
                How this figure was calculated
              </summary>
              <div className="mt-3">
                <BasisDetail basis={answer.impact.basis} />
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {answer.rootCause && (
        <Card className="min-w-0">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Likely root cause</CardTitle>
              <p className="mt-0.5 text-[12px] text-ink-secondary">{answer.rootCause.entityLabel}</p>
            </div>
            <ConfidenceBadge confidence={answer.rootCause.confidence} />
          </CardHeader>
          <CardContent>
            <h3 className="text-[15px] font-semibold leading-snug text-ink text-balance">
              {answer.rootCause.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
              {answer.rootCause.statement}
            </p>
            <div className="mt-3">
              <EvidenceHandles ids={answer.rootCause.evidenceIds} title={answer.rootCause.title} />
            </div>
          </CardContent>
        </Card>
      )}

      {answer.path && pathNodes.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Causal path</CardTitle>
            <Badge tone="outline">{answer.path.nodeIds.length} hops</Badge>
          </CardHeader>
          <CardContent>
            <CausalPath path={answer.path} nodes={pathNodes} title={answer.path.label} />
            {answer.graph && (
              <Link
                href={`/digital-map?focus=${answer.path.nodeIds[Math.floor(answer.path.nodeIds.length / 2)]}&path=${answer.path.id}`}
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Show this path on the digital map
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {answer.recommendations.length > 0 && (
        <RecommendedActions recommendations={answer.recommendations} />
      )}

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2">
            <Brain className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <CardTitle>How this was worked out</CardTitle>
          </div>
          <button
            type="button"
            onClick={() => setShowWorking((v) => !v)}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent"
            aria-expanded={showWorking}
          >
            {showWorking ? "Hide" : "Show"} working
            <CaretDown className={cn("size-3.5 transition-transform", showWorking && "rotate-180")} aria-hidden />
          </button>
        </CardHeader>
        {showWorking && (
          <CardContent>
            <p className="text-[12.5px] text-ink-secondary">
              {formatNumber(answer.investigation.entitiesTouched)} entities traversed ·{" "}
              {formatNumber(answer.investigation.factsConsidered)} facts considered
            </p>
            <ol className="mt-3 space-y-3">
              {answer.investigation.steps.map((step) => (
                <li key={step.id} className="rounded-lg bg-surface-sunken p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-surface text-[11px] font-semibold tabular text-ink-secondary">
                      {step.order}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">
                      {step.action}
                    </span>
                    <span className="text-[11px] tabular text-ink-muted">
                      {formatDurationMs(step.durationMs)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-secondary text-pretty">
                    {step.finding}
                  </p>
                  {step.query && (
                    <pre
                      className="mt-2 overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-secondary"
                      data-slot="scroll-thin"
                    >
                      {step.query}
                    </pre>
                  )}
                  {step.evidenceIds.length > 0 && (
                    <div className="mt-2">
                      <EvidenceHandles ids={step.evidenceIds} title={step.action} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        )}
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
          <Badge tone="outline">{answer.evidence.length} records</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            {answer.evidence.map((record) => (
              <EvidenceCard key={record.id} evidence={record} compact />
            ))}
          </div>
        </CardContent>
      </Card>

      {answer.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {answer.followUps.map((followUp) => (
            <Button
              key={followUp}
              variant="secondary"
              size="sm"
              onClick={() => onFollowUp(followUp)}
            >
              {followUp}
              <ArrowRight />
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
