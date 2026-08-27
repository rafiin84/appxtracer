"use client";

import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Recommendation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { cn } from "@/lib/utils/cn";

const EFFORT_LABEL: Record<Recommendation["effort"], string> = {
  immediate: "Do now",
  "short-term": "This week",
  structural: "Structural",
};

const EFFORT_TONE: Record<Recommendation["effort"], "critical" | "warning" | "neutral"> = {
  immediate: "critical",
  "short-term": "warning",
  structural: "neutral",
};

/**
 * "What should I do now?"
 *
 * Recommendations are the one place the product speaks in its own voice, so
 * they are marked as AI interpretation, carry a confidence, and every one links
 * back to the evidence it was reasoned from.
 */
export function RecommendedActions({
  recommendations,
  className,
}: {
  recommendations: Recommendation[];
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>What should I do now?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            Ranked by business impact recovered per unit of effort.
          </p>
        </div>
        <ProvenanceBadge provenance="interpreted" />
      </CardHeader>

      <CardContent>
        <ol className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={rec.id}>
              <div
                className={cn(
                  "rounded-card p-3.5 ring-hairline",
                  index === 0 ? "bg-accent-soft/40" : "bg-surface",
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="grid size-5 place-items-center rounded-full bg-ink text-[11px] font-semibold text-ink-inverse tabular">
                    {index + 1}
                  </span>
                  <Badge tone={EFFORT_TONE[rec.effort]}>{EFFORT_LABEL[rec.effort]}</Badge>
                  <span className="text-[11.5px] text-ink-muted">{rec.owningTeam}</span>
                  <ConfidenceBadge confidence={rec.confidence} className="ml-auto" />
                </div>

                <h4 className="mt-2.5 text-[14px] font-semibold leading-snug text-ink text-balance">
                  {rec.title}
                </h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary text-pretty">
                  {rec.rationale}
                </p>

                <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-surface-sunken px-2.5 py-2">
                  <CaretRight className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden />
                  <p className="text-[12.5px] leading-relaxed text-ink-secondary text-pretty">
                    <span className="font-medium text-ink">Expected effect · </span>
                    {rec.expectedEffect}
                  </p>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <EvidenceHandles ids={rec.evidenceIds} title={rec.title} />
                  {rec.relatedIncidentId && (
                    <Link
                      href={`/incidents/${rec.relatedIncidentId}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
                    >
                      Open incident
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
