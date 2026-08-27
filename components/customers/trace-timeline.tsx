"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  Cursor,
  FileText,
  MagnifyingGlass,
  PlugsConnected,
  WarningOctagon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Interaction } from "@/types";
import { formatDurationMs, formatTime } from "@/lib/formatters";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

const KIND_ICON: Record<Interaction["kind"], Icon> = {
  "page-view": FileText,
  tap: Cursor,
  "form-submit": FileText,
  "api-call": PlugsConnected,
  "payment-attempt": CreditCard,
  search: MagnifyingGlass,
  error: WarningOctagon,
};

const STATUS_STYLE = {
  ok: { ring: "bg-surface-sunken text-ink-secondary", label: "OK", tone: "neutral" },
  slow: { ring: "bg-warning-soft text-warning-ink", label: "Slow", tone: "warning" },
  error: { ring: "bg-critical-soft text-critical-ink", label: "Failed", tone: "critical" },
} as const;

/**
 * The customer's session as they lived it — every interaction, how long it
 * took, and which ones have evidence attached. The failing interaction is the
 * one the eye should land on.
 */
export function TraceTimeline({
  interactions,
  failureInteractionId,
  className,
}: {
  interactions: Interaction[];
  failureInteractionId?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const slowest = interactions.reduce((max, i) => Math.max(max, i.durationMs ?? 0), 1);

  return (
    <ol className={cn("relative", className)}>
      {interactions.map((interaction, index) => {
        const Icon = KIND_ICON[interaction.kind];
        const style = STATUS_STYLE[interaction.status];
        const last = index === interactions.length - 1;
        const isFailure = interaction.id === failureInteractionId;

        return (
          <motion.li
            key={interaction.id}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : index * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-3.5"
          >
            <div className="flex flex-col items-center">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", style.ring)}>
                <Icon className="size-4" weight="fill" aria-hidden />
              </span>
              {!last && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
            </div>

            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
              <div
                className={cn(
                  "rounded-card px-3 py-2.5",
                  isFailure ? "bg-critical-soft ring-1 ring-critical/30" : "bg-surface-sunken",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    className="text-[12px] font-medium tabular text-ink-muted"
                    dateTime={interaction.at}
                  >
                    {formatTime(interaction.at, true)}
                  </time>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                    {interaction.label}
                  </span>
                  {interaction.durationMs !== undefined && (
                    <span
                      className={cn(
                        "shrink-0 text-[12px] font-semibold tabular",
                        interaction.status === "error"
                          ? "text-critical-ink"
                          : interaction.status === "slow"
                            ? "text-warning-ink"
                            : "text-ink-secondary",
                      )}
                    >
                      {formatDurationMs(interaction.durationMs)}
                    </span>
                  )}
                  <Badge tone={style.tone}>{style.label}</Badge>
                </div>

                {interaction.durationMs !== undefined && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden>
                    <div
                      className={cn(
                        "h-full rounded-r-[3px]",
                        interaction.status === "error"
                          ? "bg-critical"
                          : interaction.status === "slow"
                            ? "bg-warning"
                            : "bg-accent",
                      )}
                      style={{ width: `${Math.max(2, (interaction.durationMs / slowest) * 100)}%` }}
                    />
                  </div>
                )}

                {interaction.detail && (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-secondary text-pretty">
                    {interaction.detail}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                  {interaction.applicationId && <span>{interaction.applicationId}</span>}
                  {interaction.traceId && (
                    <span className="font-mono">trace {interaction.traceId}</span>
                  )}
                  {interaction.evidenceIds.length > 0 && (
                    <EvidenceHandles ids={interaction.evidenceIds} title={interaction.label} />
                  )}
                </div>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
