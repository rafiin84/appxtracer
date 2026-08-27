"use client";

import Link from "next/link";
import { ArrowRight, TrendUp } from "@phosphor-icons/react/dist/ssr";
import type { EmergingRisk } from "@/types";
import { formatMoneyCompact, formatPercent } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/progress";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { EvidenceHandle, handleFromId } from "@/components/shared/evidence-handle";
import { cn } from "@/lib/utils/cn";

const SEVERITY_TONE = { high: "critical", medium: "warning", low: "neutral" } as const;

/**
 * A forward-looking risk. Likelihood is a modelled number, so it appears beside
 * its confidence and its leading indicators rather than alone.
 */
export function RiskCard({ risk, className }: { risk: EmergingRisk; className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={SEVERITY_TONE[risk.severityIfRealised]}>
            <TrendUp weight="fill" aria-hidden />
            {risk.severityIfRealised} if realised
          </Badge>
          <Badge tone="outline">{risk.horizon}</Badge>
        </div>

        <h3 className="mt-2.5 text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink text-balance">
          {risk.title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary text-pretty">
          {risk.statement}
        </p>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11.5px] text-ink-muted">Modelled likelihood</span>
            <span className="text-[13px] font-semibold tabular text-ink">
              {formatPercent(risk.likelihood * 100, 0)}
            </span>
          </div>
          <Meter
            className="mt-1.5"
            value={risk.likelihood * 100}
            tone={risk.severityIfRealised === "high" ? "serious" : "warning"}
            label={`${risk.title} likelihood`}
          />
        </div>

        <dl className="mt-4 space-y-1.5">
          {risk.leadingIndicators.map((indicator) => (
            <div key={indicator.label} className="flex items-baseline justify-between gap-3 text-[12px]">
              <dt className="min-w-0 truncate text-ink-secondary">{indicator.label}</dt>
              <dd className="flex shrink-0 items-center gap-1.5 font-medium tabular text-ink">
                {indicator.value}
                <EvidenceHandle
                  evidenceId={indicator.evidenceId}
                  handle={handleFromId(indicator.evidenceId)}
                  bundle={risk.leadingIndicators.map((i) => i.evidenceId)}
                  title={risk.title}
                />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <span className="text-[12px] text-ink-secondary">
            Up to{" "}
            <span className="font-semibold text-ink">{formatMoneyCompact(risk.potentialImpact)}</span>{" "}
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-derived">est.</span>
          </span>
          <ConfidenceBadge confidence={risk.confidence} />
        </div>

        <Link
          href={`/impact?origin=${risk.entityId}`}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Model the blast radius
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
