"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, ChatCircleDots, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/app-store";
import { useEntitySearch } from "@/hooks/use-graph";
import { useAskSuggestions } from "@/hooks/use-ask-appx";
import { ALL_NAV } from "./navigation";
import { HealthDot } from "@/components/shared/health-badge";
import { classLabel } from "@/lib/ontology/classes";
import { cn } from "@/lib/utils/cn";

/**
 * One entry point for three things a user might want: go somewhere, find an
 * entity, or ask a question. Anything that is not a navigation target or a
 * known entity falls through to Ask APPX rather than returning "no results".
 */
export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const [term, setTerm] = React.useState("");

  const { data: entities } = useEntitySearch(term);
  const { data: suggestions } = useAskSuggestions();

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    setTerm("");
    router.push(href);
  };

  const askIt = (question: string) => go(`/ask?q=${encodeURIComponent(question)}`);

  const looksLikeQuestion = term.trim().length > 8 && /\s/.test(term.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[12%] max-w-xl translate-y-0 overflow-hidden p-0"
        showClose={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Search, navigate or ask</DialogTitle>
        <Command shouldFilter={false} loop className="flex max-h-[min(30rem,70vh)] flex-col">
          <div className="flex items-center gap-2.5 px-4 hairline-b">
            <MagnifyingGlass className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <Command.Input
              value={term}
              onValueChange={setTerm}
              placeholder="Search entities, jump to a screen, or ask a question…"
              className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>

          <Command.List className="flex-1 overflow-y-auto p-2" data-slot="scroll-thin">
            <Command.Empty className="px-3 py-6 text-center text-[13px] text-ink-secondary">
              Nothing matched. Press Enter to ask APPX instead.
            </Command.Empty>

            {looksLikeQuestion && (
              <Command.Group heading="Ask APPX" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-ink-muted">
                <PaletteItem onSelect={() => askIt(term)}>
                  <ChatCircleDots className="size-4 shrink-0 text-accent" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">“{term}”</span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                </PaletteItem>
              </Command.Group>
            )}

            {(entities?.data.length ?? 0) > 0 && (
              <Command.Group heading="Entities" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-ink-muted">
                {entities?.data.map((node) => (
                  <PaletteItem
                    key={node.id}
                    onSelect={() => go(node.href ?? `/digital-map?focus=${node.id}`)}
                  >
                    <HealthDot health={node.health} />
                    <span className="min-w-0 flex-1 truncate">{node.label}</span>
                    <span className="shrink-0 text-[11.5px] text-ink-muted">{classLabel(node.kind)}</span>
                  </PaletteItem>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-ink-muted">
              {ALL_NAV.filter(
                (item) =>
                  !term ||
                  item.label.toLowerCase().includes(term.toLowerCase()) ||
                  item.question.toLowerCase().includes(term.toLowerCase()),
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <PaletteItem key={item.href} onSelect={() => go(item.href)}>
                    <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="hidden shrink-0 truncate text-[11.5px] text-ink-muted sm:block">
                      {item.question}
                    </span>
                  </PaletteItem>
                );
              })}
            </Command.Group>

            {!term && (
              <Command.Group heading="Suggested questions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-ink-muted">
                {suggestions?.data.slice(0, 4).map((suggestion) => (
                  <PaletteItem key={suggestion.id} onSelect={() => askIt(suggestion.question)}>
                    <ChatCircleDots className="size-4 shrink-0 text-ink-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{suggestion.question}</span>
                  </PaletteItem>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function PaletteItem({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink",
        "data-[selected=true]:bg-surface-sunken",
        className,
      )}
    >
      {children}
    </Command.Item>
  );
}
