"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { PRIMARY_NAV, SECONDARY_NAV } from "./navigation";
import { Wordmark } from "./logo";
import { EnvironmentSwitcher } from "./environment-switcher";
import { cn } from "@/lib/utils/cn";

/** The bottom bar keeps the four destinations a phone user actually needs. */
export function MobileTabBar() {
  const pathname = usePathname();
  const items = PRIMARY_NAV.filter((i) => i.primaryMobile);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex bg-plane/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden hairline-t"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
              active ? "text-accent" : "text-ink-muted",
            )}
          >
            <Icon className="size-5" weight={active ? "fill" : "regular"} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" aria-describedby={undefined}>
        <div className="px-4 py-4 hairline-b">
          <DialogTitle asChild>
            <Wordmark />
          </DialogTitle>
        </div>
        <div className="px-3 py-3 hairline-b">
          <EnvironmentSwitcher className="w-full justify-start" />
        </div>
        <nav aria-label="All destinations" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-2.5 py-2.5",
                      active ? "bg-surface-sunken text-ink" : "text-ink-secondary",
                    )}
                  >
                    <Icon className="mt-0.5 size-[18px] shrink-0" weight={active ? "fill" : "regular"} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-ink">{item.label}</span>
                      <span className="block text-[12px] text-ink-muted">{item.question}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="px-2.5 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Analysis
          </p>
          <ul className="space-y-0.5">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[14px] font-medium text-ink-secondary"
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Dialog>
  );
}
