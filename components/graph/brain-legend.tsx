"use client";

import type { CategorySummary } from "@/lib/graph/brain-layout";
import type { GraphNodeKind } from "@/types";
import { Card } from "@/components/ui/card";
import { HealthDot } from "@/components/shared/health-badge";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

/**
 * The diagram's key, and its accessible reading.
 *
 * A radial canvas cannot carry 24 labels without collapsing, so the labels live
 * here instead — a ranked, clickable list that says exactly what the picture
 * says and works with a screen reader and a keyboard.
 */
export function BrainLegend({
  categories,
  totals,
  highlighted,
  onHighlight,
  className,
}: {
  categories: CategorySummary[];
  totals: { entities: number; relationships: number };
  highlighted?: GraphNodeKind;
  onHighlight: (kind?: GraphNodeKind) => void;
  className?: string;
}) {
  const largest = Math.max(...categories.map((c) => c.count), 1);

  return (
    <Card className={cn("flex min-w-0 flex-col overflow-hidden", className)}>
      <div className="p-4 hairline-b">
        <p className="text-[13.5px] font-semibold text-ink">
          {formatNumber(totals.entities)} entities · {categories.length} categories
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary text-pretty">
          Dots are entities, coloured by health. Rings are ontology categories. Drag to pan, scroll
          the controls to zoom, and select any node to inspect it.
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2" data-slot="scroll-thin">
        {categories.map((category) => {
          const active = highlighted === category.id;
          return (
            <li key={category.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onHighlight(active ? undefined : category.id)}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                  active ? "bg-surface-sunken ring-1 ring-accent" : "hover:bg-surface-sunken",
                )}
              >
                <span className="flex items-center gap-2">
                  <HealthDot health={category.health} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                    {category.label}
                  </span>
                  <span className="shrink-0 text-[12px] tabular font-medium text-ink">
                    {category.count}
                  </span>
                </span>
                <span
                  className="mt-1 block h-1 overflow-hidden rounded-full bg-surface-sunken"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full bg-[var(--tenant)]"
                    style={{ width: `${(category.count / largest) * 100}%` }}
                  />
                </span>
                {category.unhealthy > 0 && (
                  <span className="mt-1 block text-[11px] text-critical-ink">
                    {category.unhealthy} degraded or worse
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-[11px] text-ink-secondary hairline-t">
        {(["critical", "impaired", "degraded", "healthy"] as const).map((health) => (
          <span key={health} className="flex items-center gap-1.5">
            <HealthDot health={health} />
            <span className="capitalize">{health}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}
