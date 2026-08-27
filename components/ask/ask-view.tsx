"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUp, ChatCircleDots, Trash, User } from "@phosphor-icons/react/dist/ssr";
import { useAskAppx, useAskSuggestions } from "@/hooks/use-ask-appx";
import { useInvestigationStore } from "@/stores/investigation-store";
import { PageHeader, PageShell } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AskAnswerView } from "./ask-answer";
import { ErrorState } from "@/components/shared/states";
import { ProvenanceLegend } from "@/components/shared/provenance";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

const CATEGORY_LABEL: Record<string, string> = {
  impact: "Impact",
  cause: "Cause",
  trace: "Trace",
  change: "Change",
  risk: "Risk",
  action: "Action",
};

/**
 * Ask APPX.
 *
 * The conversation is the screen. Suggestions are contextual — they name what
 * is happening right now rather than offering generic prompts — and every
 * answer arrives in the same evidence-backed shape.
 */
export function AskView() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = React.useState("");
  const { submit, isPending } = useAskAppx();
  const { data: suggestions } = useAskSuggestions();
  const conversation = useInvestigationStore((s) => s.conversation);
  const clear = useInvestigationStore((s) => s.clearConversation);
  const endRef = React.useRef<HTMLDivElement>(null);
  const askedInitial = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!initial || askedInitial.current === initial) return;
    askedInitial.current = initial;
    submit(initial);
  }, [initial, submit]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.length, isPending]);

  const send = (question: string) => {
    setValue("");
    submit(question);
  };

  return (
    <PageShell className="space-y-6">
      <PageHeader
        question="Ask anything about your app"
        title="Ask APPX"
        description="Ask in plain language. Every answer comes back with business impact, a causal chain, a visible path through your estate, and the evidence behind each claim."
        actions={
          conversation.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash />
              Clear conversation
            </Button>
          ) : undefined
        }
      />

      {conversation.length === 0 && (
        <Card className="p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
            Worth asking right now
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {(suggestions?.data ?? []).map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => send(suggestion.question)}
                  className="group flex w-full flex-col gap-1 rounded-card p-3 text-left ring-hairline transition-shadow hover:shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Badge tone="outline">{CATEGORY_LABEL[suggestion.category]}</Badge>
                  </span>
                  <span className="text-[13.5px] font-medium text-ink">{suggestion.question}</span>
                  <span className="text-[12px] text-ink-muted text-pretty">{suggestion.context}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5 hairline-t pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              How to read an answer
            </p>
            <ProvenanceLegend className="mt-2" />
          </div>
        </Card>
      )}

      <div className="space-y-8 pb-4">
        {conversation.map((turn) => (
          <div key={turn.id} className="space-y-4">
            <div className="flex justify-end">
              <div className="flex max-w-2xl items-start gap-2.5 rounded-panel bg-accent px-4 py-2.5 text-on-accent">
                <p className="min-w-0 text-[14px] leading-relaxed text-pretty">{turn.question}</p>
                <User className="mt-0.5 size-4 shrink-0 opacity-70" weight="fill" aria-hidden />
              </div>
            </div>

            {turn.status === "pending" && <ThinkingCard />}

            {turn.status === "failed" && (
              <Card>
                <ErrorState
                  title="That question could not be answered"
                  description={turn.error ?? "The investigation service did not respond."}
                />
              </Card>
            )}

            {turn.status === "answered" && turn.answer && (
              <AskAnswerView answer={turn.answer} onFollowUp={send} />
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 z-10 sm:bottom-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value.trim()) send(value.trim());
          }}
          className={cn(
            "flex items-end gap-2 rounded-panel bg-surface p-2 shadow-lg ring-hairline",
          )}
        >
          <label htmlFor="ask-input" className="sr-only">
            Ask APPX a question
          </label>
          <ChatCircleDots className="mb-2.5 ml-2 size-4 shrink-0 text-ink-muted" aria-hidden />
          <textarea
            id="ask-input"
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (value.trim()) send(value.trim());
              }
            }}
            placeholder="Ask about a journey, an application, a customer, a change or a risk…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={!value.trim() || isPending}
            aria-label="Ask"
          >
            <ArrowUp weight="bold" />
          </Button>
        </form>
      </div>
    </PageShell>
  );
}

function ThinkingCard() {
  const steps = [
    "Resolving the question to entities in the graph",
    "Walking the dependency closure",
    "Correlating changes against the blast radius",
    "Quantifying business impact from observed transactions",
  ];

  return (
    <Card>
      <CardContent className="pt-5">
        <ul className="space-y-2.5">
          {steps.map((step, index) => (
            <motion.li
              key={step}
              initial={{ opacity: 0.25 }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.28 }}
              className="flex items-center gap-2.5 text-[13px] text-ink-secondary"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {step}
            </motion.li>
          ))}
        </ul>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <p className="sr-only" role="status">
          Working out an answer.
        </p>
      </CardContent>
    </Card>
  );
}
