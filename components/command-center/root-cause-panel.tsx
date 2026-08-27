"use client";

import Link from "next/link";
import { ArrowRight, Lightning } from "@phosphor-icons/react/dist/ssr";
import type { RootCause } from "@/types";
import { formatRelative } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { CausalPath } from "@/components/shared/causal-path";
import { usePathNodes } from "@/components/shared/use-path-nodes";
import { curatedPath } from "@/lib/graph/engine";

const LAYER_LABEL: Record<RootCause["layer"], string> = {
  application: "Application",
  platform: "Platform",
  infrastructure: "Infrastructure",
  network: "Network",
  security: "Security",
  change: "Change",
  "third-party": "Third party",
};

/**
 * "Why is this happening?" — the cause, what it rests on, and what else is
 * making it worse, with the chain from customer to cause rendered beside it.
 */
export function RootCausePanel({ rootCause }: { rootCause: RootCause }) {
  const path = rootCause.pathId ? curatedPath(rootCause.pathId) : undefined;
  const nodes = usePathNodes(path);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Why is this happening?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            First observed {formatRelative(rootCause.firstObservedAt)}
          </p>
        </div>
        <ConfidenceBadge confidence={rootCause.confidence} />
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="critical">
              <Lightning weight="fill" aria-hidden />
              {LAYER_LABEL[rootCause.layer]}
            </Badge>
            <ProvenanceBadge provenance={rootCause.provenance} />
          </div>

          <h3 className="mt-3 text-[16px] font-semibold leading-snug tracking-[-0.012em] text-ink text-balance">
            {rootCause.title}
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-secondary text-pretty">
            {rootCause.statement}
          </p>

          <div className="mt-3">
            <EvidenceHandles ids={rootCause.evidenceIds} title={rootCause.title} />
          </div>

          {rootCause.contributingFactors.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
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
            </div>
          )}

          <Link
            href="/ask?q=Why%20did%20checkout%20revenue%20drop%3F"
            className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Ask APPX to show its working
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {path && nodes.length > 0 && (
          <div className="min-w-0 rounded-panel bg-surface-sunken p-4">
            <CausalPath path={path} nodes={nodes} title="Customer to cause" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
