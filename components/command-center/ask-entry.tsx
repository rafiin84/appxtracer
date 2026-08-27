"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChatCircleDots, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAskSuggestions } from "@/hooks/use-ask-appx";
import { cn } from "@/lib/utils/cn";

/**
 * The Ask entry point on the home screen. It is a real input rather than a
 * link, because the fastest path from "I have a question" to an answer should
 * be typing it where you are standing.
 */
export function AskEntry({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const { data } = useAskSuggestions();
  const suggestions = data?.data.slice(0, 4) ?? [];

  const submit = (question: string) => {
    if (!question.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(question.trim())}`);
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent-ink">
            <Sparkle className="size-4" weight="fill" aria-hidden />
          </span>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Ask anything about your digital business
          </h2>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-secondary text-pretty">
          Every answer comes back with business impact, a causal chain and the evidence behind it.
        </p>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit(value);
          }}
        >
          <label htmlFor="ask-home" className="sr-only">
            Ask APPX a question
          </label>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-surface-sunken px-3.5 ring-hairline focus-within:ring-2 focus-within:ring-accent">
            <ChatCircleDots className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <input
              id="ask-home"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Why did checkout revenue drop?"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="shrink-0">
            Ask
            <ArrowRight />
          </Button>
        </form>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => submit(suggestion.question)}
                title={suggestion.context}
                className="rounded-full bg-surface-sunken px-3 py-1.5 text-[12.5px] font-medium text-ink-secondary transition-colors hover:bg-line hover:text-ink"
              >
                {suggestion.question}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
