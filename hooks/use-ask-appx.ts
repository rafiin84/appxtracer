"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { ask, getAskSuggestions } from "@/lib/api";
import type { AskAnswer, AskSuggestion } from "@/types";
import { useRequestContext } from "@/stores/app-store";
import { useInvestigationStore } from "@/stores/investigation-store";
import { useApiQuery } from "./use-api";

export function useAskSuggestions() {
  return useApiQuery<AskSuggestion[]>(["ask-suggestions"], (ctx) => getAskSuggestions(ctx));
}

/**
 * Asking is a mutation, not a query: it appends a turn to the conversation and
 * the conversation is the state the screen renders.
 */
export function useAskAppx() {
  const ctx = useRequestContext();
  const startTurn = useInvestigationStore((s) => s.startTurn);
  const completeTurn = useInvestigationStore((s) => s.completeTurn);
  const failTurn = useInvestigationStore((s) => s.failTurn);

  const mutation = useMutation<{ turnId: string; answer: AskAnswer }, Error, string>({
    mutationFn: async (question: string) => {
      const turnId = startTurn(question);
      try {
        const response = await ask(question, ctx);
        completeTurn(turnId, response.data);
        return { turnId, answer: response.data };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        failTurn(turnId, message);
        throw error;
      }
    },
  });

  const submit = useCallback(
    (question: string) => {
      if (!question.trim()) return;
      mutation.mutate(question.trim());
    },
    [mutation],
  );

  return { submit, isPending: mutation.isPending, error: mutation.error };
}
