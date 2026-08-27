"use client";

import { Broadcast, GitBranch, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Provenance } from "@/types";
import { PROVENANCE_DESCRIPTION, PROVENANCE_LABEL } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

const STYLE = {
  observed: { icon: Broadcast, colour: "text-observed", ring: "bg-observed" },
  derived: { icon: GitBranch, colour: "text-derived", ring: "bg-derived" },
  interpreted: { icon: Sparkle, colour: "text-interpreted", ring: "bg-interpreted" },
} as const;

/**
 * The trust affordance. Observed facts, derived calculations and model
 * interpretation are visually distinct everywhere they appear, and the
 * distinction is carried by the data rather than inferred at render time.
 */
export function ProvenanceBadge({
  provenance,
  size = "sm",
  showLabel = true,
  className,
}: {
  provenance: Provenance;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const style = STYLE[provenance];
  const Icon = style.icon;
  return (
    <Hint label={PROVENANCE_DESCRIPTION[provenance]}>
      <Badge tone="outline" size={size} className={cn("cursor-help", className)}>
        <Icon weight="fill" className={style.colour} aria-hidden />
        {showLabel ? PROVENANCE_LABEL[provenance] : <span className="sr-only">{PROVENANCE_LABEL[provenance]}</span>}
      </Badge>
    </Hint>
  );
}

export function ProvenanceLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {(["observed", "derived", "interpreted"] as Provenance[]).map((p) => {
        const Icon = STYLE[p].icon;
        return (
          <li key={p} className="flex items-center gap-1.5 text-[12px] text-ink-secondary">
            <Icon weight="fill" className={cn("size-3.5", STYLE[p].colour)} aria-hidden />
            {PROVENANCE_LABEL[p]}
          </li>
        );
      })}
    </ul>
  );
}
