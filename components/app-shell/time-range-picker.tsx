"use client";

import type { TimeRangeKey } from "@/types";
import { RANGE_KEYS, RANGE_SPECS } from "@/lib/mock/time";
import { useAppStore } from "@/stores/app-store";
import { Segmented } from "@/components/ui/segmented";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown, Clock } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

export function TimeRangePicker({ className }: { className?: string }) {
  const rangeKey = useAppStore((s) => s.rangeKey);
  const setRange = useAppStore((s) => s.setRange);

  return (
    <>
      <Segmented<TimeRangeKey>
        label="Time window"
        value={rangeKey}
        onChange={setRange}
        size="sm"
        className={cn("hidden xl:inline-flex", className)}
        options={RANGE_KEYS.map((key) => ({
          value: key,
          label: RANGE_SPECS[key].shortLabel,
          hint: RANGE_SPECS[key].label,
        }))}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken xl:hidden",
            className,
          )}
        >
          <Clock className="size-4 text-ink-muted" aria-hidden />
          {RANGE_SPECS[rangeKey].shortLabel}
          <CaretDown className="size-3 text-ink-muted" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {RANGE_KEYS.map((key) => (
            <DropdownMenuItem key={key} onSelect={() => setRange(key)}>
              {RANGE_SPECS[key].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
