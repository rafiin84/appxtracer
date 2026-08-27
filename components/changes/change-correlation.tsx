"use client";

import Link from "next/link";
import {
  ArrowCounterClockwise,
  Cloud,
  Database,
  Flag,
  GearSix,
  GitBranch,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Change } from "@/types";
import type { Icon } from "@phosphor-icons/react";
import { formatDateTime, formatDurationMinutes, formatRelative } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { cn } from "@/lib/utils/cn";

const KIND_ICON: Record<Change["kind"], Icon> = {
  deployment: GitBranch,
  configuration: GearSix,
  infrastructure: Cloud,
  network: UsersThree,
  security: ShieldCheck,
  database: Database,
  "feature-flag": Flag,
};

const KIND_LABEL: Record<Change["kind"], string> = {
  deployment: "Deployment",
  configuration: "Configuration",
  infrastructure: "Infrastructure",
  network: "Network",
  security: "Security",
  database: "Database",
  "feature-flag": "Feature flag",
};

const RISK_TONE = { low: "neutral", medium: "warning", high: "serious" } as const;

/**
 * A change, with its correlation to observed degradation stated as correlation
 * — never quietly upgraded to causation. Lead time and confidence are shown
 * together because a strong correlation with a 6-hour gap means something
 * different from the same correlation with a 4-minute gap.
 */
export function ChangeCorrelationCard({
  change,
  className,
  compact,
}: {
  change: Change;
  className?: string;
  compact?: boolean;
}) {
  const Icon = KIND_ICON[change.kind];
  const correlated = Boolean(change.correlation);

  return (
    <Card
      className={cn(
        "min-w-0",
        correlated && "ring-1 ring-serious/30",
        className,
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
              correlated ? "bg-serious-soft text-serious-ink" : "bg-surface-sunken text-ink-muted",
            )}
          >
            <Icon className="size-4" weight="fill" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/changes/${change.id}`}
                className="truncate text-[14px] font-semibold text-ink transition-colors hover:text-accent"
              >
                {change.title}
              </Link>
              <span className="font-mono text-[11px] text-ink-muted">{change.reference}</span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="outline">{KIND_LABEL[change.kind]}</Badge>
              <Badge tone={RISK_TONE[change.risk]}>{change.risk} risk</Badge>
              {change.rolledBack && (
                <Badge tone="neutral">
                  <ArrowCounterClockwise aria-hidden />
                  Rolled back
                </Badge>
              )}
              <span className="text-[11.5px] text-ink-muted">
                {change.actorTeam} · {formatRelative(change.at)}
              </span>
            </div>

            {!compact && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-secondary text-pretty">
                {change.summary}
              </p>
            )}
          </div>
        </div>

        {change.correlation && (
          <div className="mt-3.5 rounded-lg bg-surface-sunken p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                Correlated with degradation
              </p>
              <ConfidenceBadge confidence={change.correlation.confidence} />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink text-pretty">
              {change.correlation.observedEffect}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
              <span>
                <span className="font-medium text-ink-secondary">
                  {formatDurationMinutes(change.correlation.leadTimeMinutes)}
                </span>{" "}
                before first symptom
              </span>
              <span>{formatDateTime(change.at)}</span>
              {change.evidenceIds.length > 0 && (
                <EvidenceHandles ids={change.evidenceIds} title={`${change.reference} evidence`} />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
