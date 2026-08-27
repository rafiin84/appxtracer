import * as React from "react";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

/**
 * Page headers lead with the question the screen answers, not the noun. The
 * title is the answer's subject; the eyebrow is the CIO's question.
 */
export function PageHeader({
  question,
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  question?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-ink-secondary transition-colors hover:text-ink"
        >
          <CaretLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {question && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {question}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-[-0.022em] text-ink text-balance sm:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-secondary text-pretty">
              {description}
            </p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Standard page container: one column, generous rhythm, mobile bar clearance. */
export function PageShell({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "wide" | "full";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pb-24 pt-5 sm:px-6 sm:pb-10 sm:pt-6",
        width === "default" && "max-w-[92rem]",
        width === "wide" && "max-w-[110rem]",
        width === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  title,
  question,
  description,
  actions,
  children,
  className,
  id,
}: {
  title: string;
  question?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("min-w-0", className)} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {question && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {question}
            </p>
          )}
          <h2
            id={id ? `${id}-title` : undefined}
            className="mt-0.5 text-[17px] font-semibold tracking-[-0.015em] text-ink"
          >
            {title}
          </h2>
          {description && <p className="mt-1 text-[13px] text-ink-secondary text-pretty">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
