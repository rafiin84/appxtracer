"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Question } from "@phosphor-icons/react/dist/ssr";
import type { ImpactCalculationBasis, Money } from "@/types";
import { formatMoneyCompact, formatMoneyExact, moneyQualifier } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { ConfidenceBadge } from "./confidence-badge";
import { ProvenanceBadge } from "./provenance";
import { EvidenceHandles } from "./evidence-handle";

/**
 * A monetary figure that can never be mistaken for an accounting fact.
 *
 * The qualifier ("Estimated" / "Observed") is rendered as part of the value, not
 * beside it as decoration, and any modelled figure exposes its calculation
 * basis through "Why this number?".
 */
export function RevenueImpact({
  money,
  label,
  basis,
  size = "md",
  className,
  exact = false,
}: {
  money: Money;
  label?: string;
  basis?: ImpactCalculationBasis;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  exact?: boolean;
}) {
  const qualifier = moneyQualifier(money.provenance);
  const sizes = {
    sm: "text-[15px]",
    md: "text-xl",
    lg: "text-3xl",
    hero: "text-4xl sm:text-5xl",
  }[size];

  return (
    <div className={cn("min-w-0", className)}>
      {label && <div className="text-[12px] font-medium text-ink-secondary">{label}</div>}
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "font-semibold leading-none tracking-[-0.02em] text-ink",
            sizes,
          )}
        >
          {exact ? formatMoneyExact(money) : formatMoneyCompact(money)}
        </span>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.06em]",
            money.provenance === "observed" ? "text-observed" : "text-derived",
          )}
        >
          {qualifier}
        </span>
        {basis && <WhyThisNumber basis={basis} />}
      </div>
    </div>
  );
}

export function WhyThisNumber({
  basis,
  className,
}: {
  basis: ImpactCalculationBasis;
  className?: string;
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary transition-colors",
          "hover:bg-surface-sunken hover:text-ink",
          className,
        )}
      >
        <Question className="size-3.5" aria-hidden />
        Why this number?
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            "z-50 w-[min(26rem,calc(100vw-2rem))] rounded-panel bg-surface p-4 shadow-lg ring-hairline",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <BasisDetail basis={basis} />
          <PopoverPrimitive.Arrow className="fill-[var(--surface)]" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function BasisDetail({ basis }: { basis: ImpactCalculationBasis }) {
  return (
    <div className="space-y-3.5">
      <div>
        <h4 className="text-[13px] font-semibold text-ink">{basis.method}</h4>
        <p className="mt-1 rounded-lg bg-surface-sunken px-2.5 py-2 font-mono text-[12px] leading-relaxed text-ink-secondary">
          {basis.formula}
        </p>
      </div>

      <div>
        <h5 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">Inputs</h5>
        <ul className="mt-1.5 space-y-1.5">
          {basis.inputs.map((input) => (
            <li key={input.label} className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="flex min-w-0 items-center gap-1.5 text-ink-secondary">
                <ProvenanceBadge provenance={input.provenance} showLabel={false} />
                <span className="truncate">{input.label}</span>
              </span>
              <span className="shrink-0 font-medium tabular text-ink">{input.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h5 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
          What this figure assumes
        </h5>
        <ul className="mt-1.5 space-y-1.5">
          {basis.assumptions.map((assumption) => (
            <li key={assumption} className="flex gap-2 text-[12px] leading-relaxed text-ink-secondary">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-muted" />
              <span className="text-pretty">{assumption}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 hairline-t pt-3">
        <ConfidenceBadge confidence={basis.confidence} />
        <EvidenceHandles ids={basis.evidenceIds} title="Calculation inputs" />
      </div>
    </div>
  );
}
