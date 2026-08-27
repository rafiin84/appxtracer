"use client";

import Link from "next/link";
import { ArrowRight, Clock, Users } from "@phosphor-icons/react/dist/ssr";
import type { Incident } from "@/types";
import {
  formatCompactNumber,
  formatMoneyCompact,
  formatNumber,
  formatRelative,
} from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/shared/health-badge";
import { cn } from "@/lib/utils/cn";

const STATE_LABEL: Record<Incident["state"], string> = {
  investigating: "Investigating",
  identified: "Cause identified",
  mitigating: "Mitigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const STATE_TONE: Record<Incident["state"], "neutral" | "accent" | "good" | "warning"> = {
  investigating: "warning",
  identified: "accent",
  mitigating: "accent",
  monitoring: "neutral",
  resolved: "good",
};

/**
 * Incidents read as business consequences. The technical entities are present
 * but subordinate — the first line is always who is affected and what it costs.
 */
export function IncidentImpactCard({
  incident,
  compact,
  className,
}: {
  incident: Incident;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Card interactive className={cn("group min-w-0", className)}>
      <Link href={`/incidents/${incident.id}`} className="block p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <Badge tone={STATE_TONE[incident.state]}>{STATE_LABEL[incident.state]}</Badge>
          <span className="font-mono text-[11.5px] text-ink-muted">{incident.reference}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-ink-muted">
            <Clock className="size-3.5" aria-hidden />
            {formatRelative(incident.startedAt)}
          </span>
        </div>

        <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink text-balance">
          {incident.title}
        </h3>
        <p
          className={cn(
            "mt-1.5 text-[13px] leading-relaxed text-ink-secondary text-pretty",
            compact && "line-clamp-2",
          )}
        >
          {incident.businessSummary}
        </p>

        <dl className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <dt className="text-[11.5px] text-ink-muted">Customers affected</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[17px] font-semibold tabular text-ink">
              <Users className="size-4 text-ink-muted" aria-hidden />
              {formatNumber(incident.customersAffected)}
            </dd>
          </div>
          {incident.valueAtRisk.amount > 0 && (
            <div>
              <dt className="text-[11.5px] text-ink-muted">Value at risk</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular text-ink">
                {formatMoneyCompact(incident.valueAtRisk)}
                <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-derived">
                  est.
                </span>
              </dd>
            </div>
          )}
          {incident.observedValueLost && incident.observedValueLost.amount > 0 && (
            <div>
              <dt className="text-[11.5px] text-ink-muted">Observed lost</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular text-ink">
                {formatMoneyCompact(incident.observedValueLost)}
                <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-observed">
                  obs.
                </span>
              </dd>
            </div>
          )}
          {incident.transactionsFailed > 0 && (
            <div>
              <dt className="text-[11.5px] text-ink-muted">Transactions failed</dt>
              <dd className="mt-0.5 text-[17px] font-semibold tabular text-ink">
                {formatCompactNumber(incident.transactionsFailed)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 hairline-t pt-3 text-[11.5px] text-ink-muted">
          <span className="font-medium text-ink-secondary">{incident.owner.team}</span>
          <span aria-hidden>·</span>
          <span>
            {incident.journeyIds.length} {incident.journeyIds.length === 1 ? "journey" : "journeys"}
          </span>
          <span aria-hidden>·</span>
          <span>{incident.regions.length} regions</span>
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            Investigate
            <ArrowRight className="size-3" aria-hidden />
          </span>
        </div>
      </Link>
    </Card>
  );
}
