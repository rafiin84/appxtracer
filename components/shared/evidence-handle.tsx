"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useInvestigationStore } from "@/stores/investigation-store";

/**
 * An inline, clickable evidence reference — "E3" in running prose.
 *
 * Opening one puts the whole bundle in the drawer with that record active, so a
 * reader can move between the facts backing a claim without losing the claim.
 */
export function EvidenceHandle({
  handle,
  evidenceId,
  bundle,
  title,
  className,
}: {
  handle: string;
  evidenceId: string;
  /** Every record the surrounding claim rests on. Defaults to just this one. */
  bundle?: string[];
  title?: string;
  className?: string;
}) {
  const openEvidence = useInvestigationStore((s) => s.openEvidence);
  return (
    <button
      type="button"
      onClick={() =>
        openEvidence(bundle?.length ? bundle : [evidenceId], { activeId: evidenceId, title })
      }
      className={cn(
        "mx-[1px] inline-flex h-[1.15rem] min-w-[1.6rem] items-center justify-center rounded-[5px] bg-accent-soft px-1 align-[0.05em] text-[10.5px] font-semibold text-accent-ink transition-colors",
        "hover:bg-accent hover:text-on-accent focus-visible:bg-accent focus-visible:text-on-accent",
        className,
      )}
      aria-label={`Open evidence ${handle}`}
    >
      {handle}
    </button>
  );
}

/**
 * Derives the display handle from an evidence id. Ids are zero-padded for
 * stable sorting (`ev-002`); handles are not (`E2`).
 */
export function handleFromId(id: string): string {
  const digits = id.replace(/\D/g, "");
  return digits ? `E${Number(digits)}` : id;
}

/** A row of handles following a sentence or a claim. */
export function EvidenceHandles({
  ids,
  handles,
  title,
  className,
  label = "Evidence",
}: {
  ids: string[];
  handles?: Record<string, string>;
  title?: string;
  className?: string;
  label?: string;
}) {
  if (!ids.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      <span className="sr-only">{label}:</span>
      {ids.map((id) => (
        <EvidenceHandle
          key={id}
          evidenceId={id}
          handle={handles?.[id] ?? handleFromId(id)}
          bundle={ids}
          title={title}
        />
      ))}
    </span>
  );
}
