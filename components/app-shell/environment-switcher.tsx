"use client";

import { CaretUpDown, Check } from "@phosphor-icons/react/dist/ssr";
import { COMPANY, ENVIRONMENTS } from "@/lib/mock/company";
import { useAppStore } from "@/stores/app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCompactNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { TenantTile } from "./tenant-logo";

/**
 * Who am I looking at, and in which environment?
 *
 * APPX Tracer is the product; NovaCart is the tenant whose app it is
 * reporting on. Naming the tenant in the chrome removes any ambiguity about
 * whose customers, journeys and revenue the numbers on screen describe.
 */
export function EnvironmentSwitcher({ className }: { className?: string }) {
  const environmentId = useAppStore((s) => s.environmentId);
  const setEnvironment = useAppStore((s) => s.setEnvironment);
  const current = ENVIRONMENTS.find((e) => e.id === environmentId) ?? ENVIRONMENTS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-sunken",
          className,
        )}
      >
        <TenantTile />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold leading-tight text-ink">
            {COMPANY.name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-ink-muted">
            {current.name}
          </span>
        </span>
        <CaretUpDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <div className="flex items-start gap-2.5 px-2.5 py-2">
          <TenantTile className="size-8" />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {COMPANY.name}
            </span>
            <span className="block text-[11.5px] leading-snug text-ink-muted">
              {COMPANY.tagline} · {formatCompactNumber(COMPANY.monthlyActiveCustomers)} monthly
              active customers
            </span>
          </span>
        </div>

        <DropdownMenuSeparator />
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
