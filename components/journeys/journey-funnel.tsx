"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { BusinessJourney, JourneyStep } from "@/types";
import { formatLatency, formatPercent } from "@/lib/formatters";
import { HealthDot } from "@/components/shared/health-badge";
import { ChartFrame, ChartTable } from "@/components/shared/charts/chart-frame";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

const HEALTH_FILL = {
  healthy: "var(--good)",
  degraded: "var(--warning)",
  impaired: "var(--serious)",
  critical: "var(--critical)",
  unknown: "var(--ink-muted)",
} as const;

/**
 * The journey as a funnel of steps.
 *
 * Each step's bar is the share of entrants still in the journey at that point,
 * so the failing step is visible as a cliff rather than as a number in a table.
 * The 2px gaps between segments are surface-coloured, never strokes.
 */
export function JourneyFunnel({
  journey,
  onSelectStep,
  selectedStepId,
}: {
  journey: BusinessJourney;
  onSelectStep?: (step: JourneyStep) => void;
  selectedStepId?: string;
}) {
  const reduced = usePrefersReducedMotion();

  // Cumulative survival through the funnel, entrants = 100%.
  const survival: number[] = [];
  journey.steps.reduce((carried, step) => {
    const next = carried * (step.successRatePct / 100);
    survival.push(next * 100);
    return next;
  }, 1);

  return (
    <ChartFrame
      title="Journey funnel"
      subtitle="Share of entrants still in the journey at each step"
      series={[]}
      ariaSummary={`${journey.name} funnel. ${journey.steps
        .map((s, i) => `${s.name}: ${formatPercent(survival[i])} of entrants remain, ${formatPercent(s.successRatePct)} step success rate`)
        .join(". ")}.`}
      table={
        <ChartTable
          caption={`${journey.name} funnel steps`}
          columns={["Step", "Remaining", "Step success", "Drop-off", "p95", "Errors"]}
          rows={journey.steps.map((step, i) => [
            step.name,
            formatPercent(survival[i]),
            formatPercent(step.successRatePct),
            formatPercent(step.dropOffPct),
            formatLatency(step.p95LatencyMs),
            formatPercent(step.errorRatePct),
          ])}
        />
      }
    >
      <ol className="space-y-2.5">
        {journey.steps.map((step, index) => {
          const remaining = survival[index];
          const selected = step.id === selectedStepId;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep?.(step)}
                disabled={!onSelectStep}
                className={cn(
                  "w-full rounded-lg px-2 py-2 text-left transition-colors",
                  onSelectStep && "hover:bg-surface-sunken",
                  selected && "bg-surface-sunken ring-1 ring-accent",
                  !onSelectStep && "cursor-default",
                )}
              >
                <div className="flex items-center gap-2">
                  <HealthDot health={step.health} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                    <span className="mr-1.5 tabular text-ink-muted">{index + 1}</span>
                    {step.name}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular text-ink">
                    {formatPercent(remaining)}
                  </span>
                  {onSelectStep && (
                    <CaretRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                  )}
                </div>

                <div className="mt-2 h-3 w-full overflow-hidden rounded-[4px] bg-surface-sunken" aria-hidden>
                  <motion.div
                    className="h-full rounded-r-[4px]"
                    style={{ background: HEALTH_FILL[step.health] }}
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${Math.max(2, remaining)}%` }}
                    transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11.5px] tabular text-ink-muted">
                  <span>{formatPercent(step.successRatePct)} step success</span>
                  <span>{formatPercent(step.dropOffPct)} drop-off</span>
                  <span>p95 {formatLatency(step.p95LatencyMs)}</span>
                  <span>{formatPercent(step.errorRatePct)} errors</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}
