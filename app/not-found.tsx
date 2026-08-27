import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/app-shell/logo";
import { PRIMARY_NAV } from "@/components/app-shell/navigation";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center px-6 py-16">
      <Wordmark />
      <h1 className="mt-8 text-3xl font-semibold tracking-[-0.025em] text-ink">
        That page does not exist
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary text-pretty">
        The address may be stale, or the entity it referenced is no longer in the graph. Here is
        everywhere you can go from the business layer down.
      </p>

      <ul className="mt-8 space-y-1">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-sunken"
              >
                <Icon className="size-[18px] shrink-0 text-ink-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-ink">{item.label}</span>
                  <span className="block text-[12.5px] text-ink-muted">{item.question}</span>
                </span>
                <ArrowRight
                  className="size-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
