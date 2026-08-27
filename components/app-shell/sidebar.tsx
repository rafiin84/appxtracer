"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CaretLineLeft } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/stores/app-store";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./navigation";
import { Wordmark } from "./logo";
import { Hint } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useCommandCenter } from "@/hooks/use-dashboard";

function NavLink({
  item,
  collapsed,
  active,
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  badge?: number;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "text-ink" : "text-ink-secondary hover:bg-surface-sunken hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-lg bg-surface-sunken"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <Icon
        className="size-[18px] shrink-0"
        weight={active ? "fill" : "regular"}
        aria-hidden
      />
      {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <Badge tone="critical" className="ml-auto tabular">
          {badge}
        </Badge>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-critical" aria-hidden />
      )}
    </Link>
  );

  if (!collapsed) return content;
  return (
    <Hint side="right" label={`${item.label} — ${item.question}`}>
      {content}
    </Hint>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const label = collapsed ? "Expand navigation" : "Collapse navigation";

  return (
    <Hint side="right" label={label}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={label}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink",
          className,
        )}
      >
        <CaretLineLeft
          className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")}
          aria-hidden
        />
      </button>
    </Hint>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);
  const { data } = useCommandCenter();
  const incidentCount = data?.data.activeIncidents.length;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-plane transition-[width] duration-300 lg:flex hairline-r",
        collapsed ? "w-[4.25rem]" : "w-[16.25rem]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          collapsed ? "flex-col px-0 pb-1 pt-3" : "h-14 px-3.5",
        )}
      >
        <Link href="/command-center" className="min-w-0 rounded-lg">
          <Wordmark compact={collapsed} />
        </Link>
        <CollapseToggle collapsed={collapsed} onToggle={toggle} className={collapsed ? "" : "ml-auto"} />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2.5 py-2" data-slot="scroll-thin">
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                collapsed={collapsed}
                active={isActive(item.href)}
                badge={item.href === "/incidents" ? incidentCount : undefined}
              />
            </li>
          ))}
        </ul>

        <div className={cn("mt-6", collapsed && "mt-4")}>
          {!collapsed && (
            <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Analysis
            </p>
          )}
          <ul className="space-y-0.5">
            {SECONDARY_NAV.map((item) => (
              <li key={item.href}>
                <NavLink item={item} collapsed={collapsed} active={isActive(item.href)} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

    </aside>
  );
}
