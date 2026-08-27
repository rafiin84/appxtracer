"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChatCircleDots, Clock } from "@phosphor-icons/react/dist/ssr";
import type { CommandCenterPayload } from "@/types";
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/shared/health-badge";
import { TrendPill } from "@/components/shared/trend-pill";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { cn } from "@/lib/utils/cn";

/**
 * The 30-second answer.
 *
 * One hero figure per view: customers affected. Everything else in the hero is
 * supporting scale — the money, the journeys, the experience score — so the eye
 * lands in one place before it starts reading.
 */
export function CioHealthHero({ payload }: { payload: CommandCenterPayload }) {
  const { health, impact, revenue, breakingJourneys, journeysTotal, experience } = payload;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        health.state === "critical" && "ring-2 ring-critical/25",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          health.state === "critical" ? "bg-critical" : "bg-accent",
        )}
      />

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <HealthBadge health={health.state} size="md" label="Digital business" />
            {health.since && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
                <Clock className="size-3.5" aria-hidden />
                Degraded {formatRelative(health.since)}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink text-balance sm:text-[26px]">
            {health.headline}
          </h2>
          <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-ink-secondary text-pretty">
            {health.subline}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button asChild variant="primary" size="md">
              <Link href="/incidents/inc-4417">
                Open the Sev 1
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/ask?q=Why%20did%20checkout%20revenue%20drop%3F">
                <ChatCircleDots />
                Ask why
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="col-span-2">
            <p className="text-[12px] font-medium text-ink-secondary">Customers affected now</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[56px]"
              >
                <AnimatedNumber value={impact.totalCustomersAffected} format={formatNumber} />
              </motion.span>
              <span className="text-[13px] text-ink-muted">
                {formatPercent(impact.affectedPct, 2)} of{" "}
                {formatCompactNumber(impact.totalCustomersActive)} active
              </span>
            </div>
            <div className="mt-2">
              <TrendPill trend={impact.affectedTrend} />
            </div>
          </div>

          <div className="min-w-0">
            <RevenueImpact
              label="Transaction value at risk"
              money={revenue.atRisk}
              size="lg"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-medium text-ink-secondary">Journeys breaking</p>
            <p className="mt-1 text-3xl font-semibold leading-none tracking-[-0.02em] text-ink">
              {breakingJourneys.length}
              <span className="ml-1 text-[15px] font-normal text-ink-muted">of {journeysTotal}</span>
            </p>
            <p className="mt-2 truncate text-[12px] text-ink-muted">
              {breakingJourneys
                .slice(0, 2)
                .map((j) => j.name)
                .join(", ")}
              {breakingJourneys.length > 2 ? ` +${breakingJourneys.length - 2}` : ""}
            </p>
          </div>

          <div className="col-span-2 flex items-end justify-between gap-4 hairline-t pt-4">
            <div>
              <p className="text-[12px] font-medium text-ink-secondary">Experience score</p>
              <p className="mt-1 text-2xl font-semibold leading-none tracking-[-0.02em] text-ink">
                {experience.score.toFixed(1)}
                <span className="ml-1 text-[13px] font-normal text-ink-muted">of 100</span>
              </p>
            </div>
            <TrendPill trend={experience.trend} />
          </div>
        </div>
      </div>
    </Card>
  );
}
