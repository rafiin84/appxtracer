"use client";

import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle,
  Detective,
  GitBranch,
  Lightning,
  TrendUp,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { IncidentTimelineEntry } from "@/types";
import { formatTime } from "@/lib/formatters";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

const KIND_ICON: Record<IncidentTimelineEntry["kind"], Icon> = {
  detected: Bell,
  impact: TrendUp,
  change: GitBranch,
  diagnosis: Detective,
  mitigation: Wrench,
  escalation: Lightning,
  resolution: CheckCircle,
};

const KIND_TONE: Record<IncidentTimelineEntry["kind"], string> = {
  detected: "bg-warning-soft text-warning-ink",
  impact: "bg-critical-soft text-critical-ink",
  change: "bg-surface-sunken text-ink-secondary",
  diagnosis: "bg-accent-soft text-accent-ink",
  mitigation: "bg-good-soft text-good-ink",
  escalation: "bg-serious-soft text-serious-ink",
  resolution: "bg-good-soft text-good-ink",
};

/**
 * The incident as a sequence. Change entries are visually distinct from impact
 * entries so the reader can see, at a glance, what was done to the system and
 * what the system then did.
 */
export function IncidentTimeline({
  entries,
  className,
}: {
  entries: IncidentTimelineEntry[];
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <ol className={cn("relative", className)}>
      {entries.map((entry, index) => {
        const Icon = KIND_ICON[entry.kind];
        const last = index === entries.length - 1;
        return (
          <motion.li
            key={entry.id}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-3.5"
          >
            <div className="flex flex-col items-center">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", KIND_TONE[entry.kind])}>
                <Icon className="size-4" weight="fill" aria-hidden />
              </span>
              {!last && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
            </div>

            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-6")}>
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-[12px] font-medium tabular text-ink-muted" dateTime={entry.at}>
                  {formatTime(entry.at, true)}
                </time>
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                  {entry.kind}
                </span>
                {entry.actorTeam && (
                  <span className="text-[11.5px] text-ink-secondary">{entry.actorTeam}</span>
                )}
                <ProvenanceBadge provenance={entry.provenance} showLabel={false} className="ml-auto" />
              </div>

              <h4 className="mt-1 text-[14px] font-semibold leading-snug text-ink text-balance">
                {entry.title}
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary text-pretty">
                {entry.detail}
              </p>

              {entry.evidenceIds.length > 0 && (
                <div className="mt-1.5">
                  <EvidenceHandles ids={entry.evidenceIds} title={entry.title} />
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
