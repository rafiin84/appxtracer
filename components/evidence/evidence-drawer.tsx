"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react/dist/ssr";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvestigationStore } from "@/stores/investigation-store";
import { useEvidenceBundle } from "@/hooks/use-evidence";
import { EvidenceCard } from "./evidence-card";
import { ProvenanceLegend } from "@/components/shared/provenance";
import { SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/states";

/**
 * The evidence drawer. Any claim in the product can open it with the exact set
 * of records that claim rests on, and the record that was clicked is scrolled to
 * and highlighted.
 */
export function EvidenceDrawer() {
  const open = useInvestigationStore((s) => s.evidenceOpen);
  const ids = useInvestigationStore((s) => s.evidenceIds);
  const activeId = useInvestigationStore((s) => s.activeEvidenceId);
  const title = useInvestigationStore((s) => s.evidenceTitle);
  const close = useInvestigationStore((s) => s.closeEvidence);
  const setActive = useInvestigationStore((s) => s.setActiveEvidence);

  const { data, isLoading } = useEvidenceBundle(open ? ids : []);
  const records = data?.data ?? [];

  React.useEffect(() => {
    if (!open || !activeId) return;
    const node = document.getElementById(`evidence-${activeId}`);
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, activeId, records.length]);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <SheetContent side="right" aria-describedby={undefined}>
        <header className="flex items-start justify-between gap-3 px-5 py-4 hairline-b">
          <div className="min-w-0">
            <DialogTitle className="text-[15px] font-semibold text-ink">{title}</DialogTitle>
            <p className="mt-0.5 text-[12px] text-ink-secondary">
              {records.length} {records.length === 1 ? "record" : "records"} · every claim resolves here
            </p>
          </div>
          <DialogClose
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close evidence"
          >
            <X className="size-4" />
          </DialogClose>
        </header>

        <div className="px-5 py-3 hairline-b">
          <ProvenanceLegend />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-3 p-5">
            {isLoading && <SkeletonText lines={8} />}
            {!isLoading && records.length === 0 && (
              <EmptyState
                title="No evidence linked"
                description="This claim has no evidence records attached. That is itself a finding — the SHACL shapes flag unattributed claims as violations."
              />
            )}
            {records.map((evidence) => (
              <motion.div
                key={evidence.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <EvidenceCard
                  evidence={evidence}
                  active={evidence.id === activeId}
                  onSelect={setActive}
                />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Dialog>
  );
}
