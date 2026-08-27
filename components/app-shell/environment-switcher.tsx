"use client";

import { CaretUpDown, Check, Buildings } from "@phosphor-icons/react/dist/ssr";
import { ENVIRONMENTS } from "@/lib/mock/company";
import { useAppStore } from "@/stores/app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export function EnvironmentSwitcher({ className }: { className?: string }) {
  const environmentId = useAppStore((s) => s.environmentId);
  const setEnvironment = useAppStore((s) => s.setEnvironment);
  const current = ENVIRONMENTS.find((e) => e.id === environmentId) ?? ENVIRONMENTS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken",
          className,
        )}
      >
        <Buildings className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <span className="min-w-0 truncate">{current.name}</span>
        <CaretUpDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Environment &amp; tenant</DropdownMenuLabel>
        {ENVIRONMENTS.map((env) => (
          <DropdownMenuItem key={env.id} onSelect={() => setEnvironment(env.id)}>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{env.name}</span>
              <span className="block truncate text-[11.5px] text-ink-muted">{env.tenant}</span>
            </span>
            {env.id === current.id && <Check className="size-4 shrink-0 text-accent" weight="bold" />}
          </DropdownMenuItem>
        ))}
        <div className="px-2.5 pb-1 pt-2 text-[11px] leading-relaxed text-ink-muted">
          Data scope follows the selected tenant. Switching environments refetches every panel.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
