import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The product's single surface primitive. Cards are hairline-ringed rather than
 * shadowed at rest — elevation is reserved for things that actually float.
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; tone?: "default" | "sunken" }
>(({ className, interactive, tone = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card ring-hairline",
      tone === "sunken" ? "bg-surface-sunken" : "bg-surface",
      interactive &&
        "transition-[box-shadow,transform] duration-200 hover:shadow-md focus-within:shadow-md",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 p-4 sm:p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-[13px] leading-relaxed text-ink-secondary", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-3 sm:px-5 hairline-t", className)}
      {...props}
    />
  );
}

/** A section label used inside dense panels. */
export function SectionLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}
