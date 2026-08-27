import { cn } from "@/lib/utils/cn";

/**
 * The tenant's mark — NovaCart, the commerce platform this instance monitors.
 *
 * Deliberately distinct from the APPX Tracer mark: a different colour and a
 * different silhouette, so the product and the customer it is reporting on are
 * never mistaken for each other. A shopping bag carrying an N monogram makes
 * the archetype legible at a glance, which is the whole point of naming the
 * tenant on screen.
 */
export function NovaCartMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden focusable="false">
      <path
        d="M4.7 7.6h14.6l-1.28 11.1a2.1 2.1 0 0 1-2.09 1.86H8.06a2.1 2.1 0 0 1-2.09-1.86L4.7 7.6Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M4.7 7.6h14.6l-1.28 11.1a2.1 2.1 0 0 1-2.09 1.86H8.06a2.1 2.1 0 0 1-2.09-1.86L4.7 7.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.75 7.6V6.15a3.25 3.25 0 0 1 6.5 0V7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.7 17.1v-5.4l4.6 5.4v-5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The tenant's tile, used wherever NovaCart is identified as the subject. */
export function TenantTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--tenant)] text-white",
        className,
      )}
    >
      <NovaCartMark className="size-[17px]" />
    </span>
  );
}

/** The tenant's mark and name as one inline chip, for page titles. */
export function TenantChip({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[var(--tenant-soft)] py-1 pl-1.5 pr-3 align-middle",
        className,
      )}
    >
      <span className="grid size-6 place-items-center rounded-full bg-[var(--tenant)] text-white">
        <NovaCartMark className="size-[15px]" />
      </span>
      <span className="text-[13px] font-semibold text-[var(--tenant)]">{name}</span>
    </span>
  );
}
