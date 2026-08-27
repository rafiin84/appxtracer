import * as React from "react";
import {
  ArrowClockwise,
  Info,
  MagnifyingGlass,
  WarningCircle,
  CloudSlash,
} from "@phosphor-icons/react/dist/ssr";
import type { Availability } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  action,
  icon: IconComponent = MagnifyingGlass,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "duotone" }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-surface-sunken text-ink-muted">
        <IconComponent className="size-5" />
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-secondary text-pretty">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "This view could not load",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-critical-soft text-critical-ink">
        <WarningCircle className="size-5" weight="fill" />
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-secondary text-pretty">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <ArrowClockwise />
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * The partial-data notice. Missing data is named rather than hidden, because a
 * silently absent revenue figure reads as "no impact".
 */
export function PartialDataNote({
  availability,
  className,
}: {
  availability?: Availability;
  className?: string;
}) {
  if (!availability || availability.state === "available") return null;
  const unavailable = availability.state === "unavailable";
  const Icon = unavailable ? CloudSlash : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3 py-2.5",
        unavailable ? "bg-critical-soft" : "bg-surface-sunken",
        className,
      )}
    >
      <Icon
        className={cn("mt-px size-4 shrink-0", unavailable ? "text-critical-ink" : "text-ink-muted")}
        weight="fill"
        aria-hidden
      />
      <div className="min-w-0 text-[12px] leading-relaxed">
        <p className={cn("font-medium", unavailable ? "text-critical-ink" : "text-ink")}>
          {unavailable
            ? "Some data for this view is unavailable"
            : availability.missing?.length
              ? `Partial data — ${availability.missing.join(", ")} ${availability.missing.length === 1 ? "is" : "are"} missing`
              : "Partial data for this window"}
        </p>
        {availability.note && <p className="mt-0.5 text-ink-secondary text-pretty">{availability.note}</p>}
      </div>
    </div>
  );
}

export function LoadingCard({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <Card className={cn("p-5", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-40" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </Card>
  );
}

export function LoadingGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
