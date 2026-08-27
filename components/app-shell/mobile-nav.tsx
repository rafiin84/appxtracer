"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DotsThree, X } from "@phosphor-icons/react/dist/ssr";
import { Dialog, DialogClose, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { PRIMARY_NAV, SECONDARY_NAV } from "./navigation";
import { Wordmark } from "./logo";
import { EnvironmentSwitcher } from "./environment-switcher";
import { cn } from "@/lib/utils/cn";

const TAB_ITEMS = PRIMARY_NAV.filter((item) => item.primaryMobile);

/**
 * The bottom bar owns navigation on a phone.
 *
 * Four destinations plus More, which opens everything else. There is no
 * hamburger: one navigation affordance in the reachable half of the screen
 * beats two, one of which sits under the user's other hand.
 */
export function MobileTabBar({
  moreOpen,
  onOpenMore,
}: {
  moreOpen: boolean;
  onOpenMore: () => void;
}) {
  const pathname = usePathname();
  const isTabRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Anything not in the four tabs lives behind More, so More carries the
  // current-page state for those routes rather than nothing looking selected.
  const moreActive = moreOpen || !TAB_ITEMS.some((item) => isTabRoute(item.href));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex bg-plane/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden hairline-t"
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = !moreOpen && isTabRoute(item.href);
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
            {item.mobileLabel ?? item.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMore}
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
          moreActive ? "text-accent" : "text-ink-muted",
        )}
      >
        <DotsThree className="size-5" weight="bold" aria-hidden />
        More
      </button>
    </nav>
  );
}

/**
 * Everything the four tabs do not carry. Opens from the bottom, next to the tab
 * that summoned it, rather than from the opposite edge of the screen.
 */
export function MobileNavSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" aria-describedby={undefined} className="max-h-[86vh]">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 hairline-b">
          <DialogTitle asChild>
            <Wordmark />
          </DialogTitle>
          <DialogClose
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </DialogClose>
        </div>

        <div className="px-3 py-3 hairline-b">
          <EnvironmentSwitcher className="w-full justify-start" />
        </div>

        <nav
          aria-label="All destinations"
          className="min-h-0 flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          data-slot="scroll-thin"
        >
          <ul className="space-y-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-2.5 py-2.5",
                      active ? "bg-surface-sunken" : "",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-[18px] shrink-0",
                        active ? "text-accent" : "text-ink-muted",
                      )}
                      weight={active ? "fill" : "regular"}
                      aria-hidden
                    />
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
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-2.5 py-2.5",
                      active ? "bg-surface-sunken" : "",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-[18px] shrink-0",
                        active ? "text-accent" : "text-ink-muted",
                      )}
                      weight={active ? "fill" : "regular"}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-ink">{item.label}</span>
                      <span className="block text-[12px] text-ink-muted">{item.question}</span>
                    </span>
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
