"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Moon,
  Sun,
  Desktop,
  UserCircle,
  List,
  WarningOctagon,
} from "@phosphor-icons/react/dist/ssr";
import { useAppStore, PERSONAS } from "@/stores/app-store";
import { useCommandCenter } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SCOPES } from "@/lib/api/scopes";
import { EnvironmentSwitcher } from "./environment-switcher";
import { TimeRangePicker } from "./time-range-picker";
import { Wordmark } from "./logo";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/formatters";

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const setPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const persona = useAppStore((s) => s.persona);
  const setPersona = useAppStore((s) => s.setPersona);
  const scopes = useAppStore((s) => s.scopes);
  const toggleScope = useAppStore((s) => s.toggleScope);
  const { data } = useCommandCenter();

  const incidents = data?.data.activeIncidents ?? [];
  const worst = incidents[0];
  const affected = data?.data.impact.totalCustomersAffected ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-plane/85 px-3 backdrop-blur-md sm:px-4 hairline-b">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-sunken lg:hidden"
        aria-label="Open navigation"
      >
        <List className="size-5" />
      </button>

      <Link href="/command-center" className="shrink-0 rounded-lg lg:hidden">
        <Wordmark compact />
      </Link>

      <div className="flex min-w-0 items-center gap-1">
        <EnvironmentSwitcher className="min-w-0" />
        <span className="hidden h-4 w-px bg-line lg:block" aria-hidden />
        <span className="hidden lg:block">
          <TimeRangePicker />
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={cn(
          "ml-auto flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface px-3 text-[13px] text-ink-muted ring-hairline transition-shadow",
          "hover:shadow-sm sm:max-w-sm lg:ml-4 lg:mr-auto",
        )}
      >
        <MagnifyingGlass className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">Search or ask about your app</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-sans text-[10.5px] font-medium text-ink-muted sm:block">
          ⌘K
        </kbd>
      </button>

      {worst && (
        <Link
          href={`/incidents/${worst.id}`}
          className="hidden items-center gap-2 rounded-lg bg-critical-soft px-2.5 py-1.5 text-[12.5px] font-medium text-critical-ink transition-colors hover:brightness-105 md:flex"
        >
          <motion.span
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="grid place-items-center"
          >
            <WarningOctagon className="size-4" weight="fill" aria-hidden />
          </motion.span>
          <span className="tabular">{formatNumber(affected)}</span>
          <span className="hidden lg:inline">customers affected</span>
        </Link>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="lg:hidden">
          <TimeRangePicker />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Appearance and profile">
              <UserCircle className="size-[18px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <div className="px-2.5 pb-2">
              <p className="text-[13px] font-medium text-ink">Demo viewer</p>
              <p className="text-[11.5px] text-ink-muted">
                Phase 1 has no authentication. Role-based visibility is modelled below.
              </p>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Lead with</DropdownMenuLabel>
            {PERSONAS.map((p) => (
              <DropdownMenuItem key={p.id} onSelect={() => setPersona(p.id)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.label}</span>
                  <span className="block truncate text-[11.5px] text-ink-muted">{p.description}</span>
                </span>
                {p.id === persona && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Data scopes</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={scopes.includes(SCOPES.pii)}
              onCheckedChange={() => toggleScope(SCOPES.pii)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="min-w-0">
                <span className="block font-medium">Customer identifiers</span>
                <span className="block text-[11.5px] text-ink-muted">
                  Unmasks email addresses. Every unmasking is written to the audit trail.
                </span>
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={scopes.includes(SCOPES.revenue)}
              onCheckedChange={() => toggleScope(SCOPES.revenue)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="min-w-0">
                <span className="block font-medium">Revenue figures</span>
                <span className="block text-[11.5px] text-ink-muted">
                  Shows observed and modelled monetary impact.
                </span>
              </span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <div className="flex gap-1 p-1">
              {(
                [
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Desktop },
                ] as const
              ).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11.5px] font-medium transition-colors",
                      theme === option.value
                        ? "bg-accent-soft text-accent-ink"
                        : "text-ink-secondary hover:bg-surface-sunken",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
