"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { GeographicImpact } from "@/types";
import {
  formatCompactNumber,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/shared/charts/bar-chart";
import { HealthDot } from "@/components/shared/health-badge";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

const HEALTH_COLOR = {
  healthy: "var(--good)",
  degraded: "var(--warning)",
  impaired: "var(--serious)",
  critical: "var(--critical)",
  unknown: "var(--ink-muted)",
} as const;

/**
 * Where the impact is.
 *
 * The plot is an abstract projection, not a map: markers sit at each region's
 * normalised position on a graticule, sized by affected customers. It shows
 * spatial concentration honestly without pretending to cartographic precision,
 * and the ranked list beside it carries the actual numbers.
 */
export function GeographicImpactPanel({ geography }: { geography: GeographicImpact[] }) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = React.useState<string | null>(null);
  const maxAffected = Math.max(...geography.map((g) => g.customersAffected), 1);
  const totalAffected = geography.reduce((sum, g) => sum + g.customersAffected, 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Where is the impact happening?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            {formatNumber(totalAffected)} affected customers across {geography.length} regions
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-surface-sunken">
            <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full" role="presentation">
              {[10, 20, 30, 40].map((y) => (
                <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="var(--grid)" strokeWidth={0.25} />
              ))}
              {[16.6, 33.3, 50, 66.6, 83.3].map((x) => (
                <line key={x} x1={x} x2={x} y1={0} y2={50} stroke="var(--grid)" strokeWidth={0.25} />
              ))}

              {geography.map((geo, index) => {
                const r = 1.6 + (geo.customersAffected / maxAffected) * 4.2;
                const cx = geo.region.x * 100;
                const cy = geo.region.y * 50;
                const isActive = active === geo.region.code;
                return (
                  <g key={geo.region.code}>
                    {geo.health !== "healthy" && !reduced && (
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={HEALTH_COLOR[geo.health]}
                        initial={{ opacity: 0.35, scale: 1 }}
                        animate={{ opacity: [0.3, 0, 0.3], scale: [1, 2.2, 1] }}
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          delay: index * 0.28,
                          ease: "easeOut",
                        }}
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={HEALTH_COLOR[geo.health]}
                      stroke="var(--surface-sunken)"
                      strokeWidth={0.7}
                      opacity={active && !isActive ? 0.4 : 1}
                      onPointerEnter={() => setActive(geo.region.code)}
                      onPointerLeave={() => setActive(null)}
                      className="cursor-pointer transition-opacity"
                    />
                    <text
                      x={cx}
                      y={cy - r - 1.4}
                      textAnchor="middle"
                      className="fill-[var(--ink-secondary)]"
                      style={{ fontSize: 2.6, fontWeight: 500 }}
                    >
                      {geo.region.hub}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            {(["critical", "impaired", "degraded", "healthy"] as const).map((health) => (
              <li key={health} className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
                <HealthDot health={health} />
                <span className="capitalize">{health}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <BarChart
            valueLabel="Customers affected"
            ariaSummary={`Customers affected by region. ${geography
              .map((g) => `${g.region.name} ${formatNumber(g.customersAffected)}`)
              .join(", ")}.`}
            rows={[...geography]
              .sort((a, b) => b.customersAffected - a.customersAffected)
              .map((geo) => ({
                id: geo.region.code,
                label: geo.region.name,
                value: geo.customersAffected,
                display: formatCompactNumber(geo.customersAffected),
                tone:
                  geo.health === "critical"
                    ? "critical"
                    : geo.health === "impaired"
                      ? "serious"
                      : geo.health === "degraded"
                        ? "warning"
                        : "good",
                meta: `${formatMoneyCompact(geo.valueAtRisk)} at risk · experience ${geo.experienceScore} · ${formatPercent(
                  (geo.customersAffected / geo.customersActive) * 100,
                  2,
                )} of active`,
              }))}
          />

          <Link
            href="/experience"
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover",
            )}
          >
            Break down by region, device and app version
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
