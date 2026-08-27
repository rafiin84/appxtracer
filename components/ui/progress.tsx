import { cn } from "@/lib/utils/cn";

/**
 * A meter. The fill carries severity; the track is a lighter step of the same
 * ramp so the state reads across the whole bar, not just the filled part.
 */
export function Meter({
  value,
  max = 100,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "good" | "warning" | "serious" | "critical";
  className?: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = {
    accent: "bg-accent",
    good: "bg-good",
    warning: "bg-warning",
    serious: "bg-serious",
    critical: "bg-critical",
  }[tone];
  const track = {
    accent: "bg-accent-soft",
    good: "bg-good-soft",
    warning: "bg-warning-soft",
    serious: "bg-serious-soft",
    critical: "bg-critical-soft",
  }[tone];

  return (
    <div
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full", track, className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
