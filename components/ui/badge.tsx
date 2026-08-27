import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border-0 font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-ink-secondary",
        accent: "bg-accent-soft text-accent-ink",
        good: "bg-good-soft text-good-ink",
        warning: "bg-warning-soft text-warning-ink",
        serious: "bg-serious-soft text-serious-ink",
        critical: "bg-critical-soft text-critical-ink",
        outline: "ring-hairline text-ink-secondary",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[11px] [&_svg]:size-3",
        md: "px-2 py-1 text-xs [&_svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

export { badgeVariants };
