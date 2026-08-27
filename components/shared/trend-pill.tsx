import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Trend } from "@/types";
import { formatSignedPercent } from "@/lib/formatters";
import { trendSentiment } from "@/lib/calculations/health";
import { cn } from "@/lib/utils/cn";

/**
 * A signed delta with its comparison window. Direction and sentiment are
 * separate: error rate rising is bad, success rate rising is good, and the
 * arrow shows movement while the colour shows whether that movement is welcome.
 */
export function TrendPill({
  trend,
  className,
  showComparison = true,
  size = "sm",
}: {
  trend: Trend;
  className?: string;
  showComparison?: boolean;
  size?: "sm" | "md";
}) {
  const sentiment = trendSentiment(trend);
  const Icon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        size === "sm" ? "text-[12px]" : "text-[13px]",
        sentiment === "good"
          ? "text-good-ink"
          : sentiment === "bad"
            ? "text-critical-ink"
            : "text-ink-muted",
        className,
      )}
    >
      <Icon weight="bold" className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      <span className="tabular">{formatSignedPercent(trend.changePct)}</span>
      {showComparison && <span className="font-normal text-ink-muted">{trend.comparedTo}</span>}
    </span>
  );
}
