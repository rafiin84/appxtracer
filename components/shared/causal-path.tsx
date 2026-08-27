"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { GraphPath } from "@/types";
import { cn } from "@/lib/utils/cn";
import { ConfidenceBadge } from "./confidence-badge";
import { EvidenceHandles } from "./evidence-handle";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

export interface CausalPathNode {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
  tone?: "start" | "middle" | "cause";
}

/**
 * The causal chain, rendered as an ordered list.
 *
 * Each hop carries the sentence that justifies it and the evidence behind that
 * sentence, so the visual chain and the accessible reading are the same
 * artefact rather than a picture with a caption bolted on.
 */
export function CausalPath({
  path,
  nodes,
  className,
  orientation = "vertical",
  title = "Causal chain",
}: {
  path: GraphPath;
  nodes: CausalPathNode[];
  className?: string;
  orientation?: "vertical" | "horizontal";
  title?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{title}</p>
        {path.confidence && <ConfidenceBadge confidence={path.confidence} />}
      </div>

      <ol
        className={cn(
          orientation === "horizontal"
            ? "flex snap-x gap-2 overflow-x-auto pb-2"
            : "space-y-0",
        )}
        data-slot="scroll-thin"
      >
        {nodes.map((node, index) => {
          const narration = path.narration[index];
          const last = index === nodes.length - 1;
          const Wrapper = node.href ? Link : "div";

          return (
            <motion.li
              key={node.id}
              initial={reduced ? false : { opacity: 0, x: orientation === "horizontal" ? 12 : 0, y: orientation === "vertical" ? 8 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: reduced ? 0 : index * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                orientation === "horizontal" ? "min-w-[13rem] shrink-0 snap-start" : "relative",
              )}
            >
              <div className={cn(orientation === "vertical" && "flex gap-3")}>
                {orientation === "vertical" && (
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular",
                        node.tone === "cause"
                          ? "bg-critical text-white"
                          : node.tone === "start"
                            ? "bg-accent text-on-accent"
                            : "bg-surface-sunken text-ink-secondary",
                      )}
                    >
                      {index + 1}
                    </span>
                    {!last && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
                  </div>
                )}

                <div className={cn("min-w-0 flex-1", orientation === "vertical" ? "pb-5" : "")}>
                  <Wrapper
                    // @ts-expect-error — Link needs href, div does not.
                    href={node.href}
                    className={cn(
                      "block rounded-lg text-[13.5px] font-semibold text-ink transition-colors",
                      node.href && "hover:text-accent",
                      orientation === "horizontal" && "rounded-card bg-surface p-3 ring-hairline",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate">{node.label}</span>
                      {node.href && <ArrowRight className="size-3 shrink-0 opacity-50" aria-hidden />}
                    </span>
                    {node.sublabel && (
                      <span className="mt-0.5 block truncate text-[11.5px] font-normal text-ink-muted">
                        {node.sublabel}
                      </span>
                    )}
                    {orientation === "horizontal" && narration && (
                      <span className="mt-2 block text-[12px] font-normal leading-relaxed text-ink-secondary text-pretty">
                        {narration}
                      </span>
                    )}
                  </Wrapper>

                  {orientation === "vertical" && narration && (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary text-pretty">
                      {narration}
                    </p>
                  )}
                </div>
              </div>

              {orientation === "horizontal" && !last && (
                <ArrowRight
                  className="absolute -right-1 top-1/2 hidden size-3 -translate-y-1/2 text-ink-muted"
                  aria-hidden
                />
              )}
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-ink-muted">Backed by</span>
        <EvidenceHandles ids={path.evidenceIds} title={path.label} />
      </div>
    </div>
  );
}

/** Compact horizontal breadcrumb of a path, for dense cards. */
export function PathBreadcrumb({
  nodes,
  className,
}: {
  nodes: CausalPathNode[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1", className)}>
      {nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          {index > 0 && <ArrowRight className="size-3 shrink-0 text-ink-muted" aria-hidden />}
          <li
            className={cn(
              "truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-medium",
              node.tone === "cause"
                ? "bg-critical-soft text-critical-ink"
                : "bg-surface-sunken text-ink-secondary",
            )}
          >
            {node.label}
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

export { ArrowDown };
