"use client";

import type { Confidence } from "@/types";
import { Hint } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/**
 * Confidence is shown as three filled segments plus a percentage, and the
 * tooltip always carries the written rationale — a number alone would invite
 * false precision.
 */
export function ConfidenceBadge({
  confidence,
  className,
  showRationale = true,
}: {
  confidence: Confidence;
  className?: string;
  showRationale?: boolean;
}) {
  const filled = confidence.band === "high" ? 3 : confidence.band === "medium" ? 2 : 1;
  const tone =
    confidence.band === "high" ? "good" : confidence.band === "medium" ? "warning" : "serious";

  const badge = (
    <Badge tone="outline" size="sm" className={cn("cursor-help gap-2", className)}>
      <span className="flex items-center gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "block h-2.5 w-1 rounded-[1px]",
              i < filled
                ? tone === "good"
                  ? "bg-good"
                  : tone === "warning"
                    ? "bg-warning"
                    : "bg-serious"
                : "bg-line-strong",
            )}
          />
        ))}
      </span>
      <span className="tabular">{Math.round(confidence.value * 100)}%</span>
      <span className="text-ink-muted">{confidence.band}</span>
    </Badge>
  );

  if (!showRationale || !confidence.rationale) return badge;
  return <Hint label={confidence.rationale}>{badge}</Hint>;
}
