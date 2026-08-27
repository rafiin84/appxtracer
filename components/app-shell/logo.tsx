import { cn } from "@/lib/utils/cn";

/**
 * The APPX Tracer mark: three signals converging into one traced path — the
 * product's whole argument in 24 pixels.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden focusable="false">
      <path
        d="M2 18.5c3.2 0 4.6-4.2 6.4-8.2C9.7 7.4 10.7 5 12 5s2.3 2.4 3.6 5.3c1.8 4 3.2 8.2 6.4 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.32"
      />
      <path
        d="M2 18.5h5.1l2.6-6.4 2.4 9.4 2.3-12.6 2 9.6H22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent text-on-accent">
        <Logo className="size-[18px]" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold leading-tight tracking-[-0.015em] text-ink">
            APPX Tracer
          </span>
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.05em] text-ink-muted">
            Application Experience
          </span>
        </span>
      )}
    </span>
  );
}
