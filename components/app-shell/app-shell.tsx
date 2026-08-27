"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNavSheet, MobileTabBar } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex min-h-svh w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileTabBar moreOpen={moreOpen} onOpenMore={() => setMoreOpen(true)} />
      <MobileNavSheet open={moreOpen} onOpenChange={setMoreOpen} />
      <CommandPalette />
      <EvidenceDrawer />
    </div>
  );
}
