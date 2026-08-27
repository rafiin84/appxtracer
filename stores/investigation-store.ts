"use client";

import { create } from "zustand";
import type { AskAnswer } from "@/types";

export interface AskTurn {
  id: string;
  question: string;
  askedAt: string;
  answer?: AskAnswer;
  status: "pending" | "answered" | "failed";
  error?: string;
}

interface InvestigationState {
  /** Evidence drawer. */
  evidenceOpen: boolean;
  evidenceIds: string[];
  activeEvidenceId?: string;
  evidenceTitle: string;

  /** Cross-screen selection, so a drill-down keeps its context. */
  selectedIncidentId?: string;
  selectedJourneyId?: string;
  selectedApplicationId?: string;

  /** Ask APPX conversation. */
  conversation: AskTurn[];

  openEvidence: (ids: string[], options?: { activeId?: string; title?: string }) => void;
  closeEvidence: () => void;
  setActiveEvidence: (id?: string) => void;

  selectIncident: (id?: string) => void;
  selectJourney: (id?: string) => void;
  selectApplication: (id?: string) => void;

  startTurn: (question: string) => string;
  completeTurn: (id: string, answer: AskAnswer) => void;
  failTurn: (id: string, error: string) => void;
  clearConversation: () => void;
}

let turnCounter = 0;

export const useInvestigationStore = create<InvestigationState>()((set) => ({
  evidenceOpen: false,
  evidenceIds: [],
  activeEvidenceId: undefined,
  evidenceTitle: "Evidence",

  conversation: [],

  openEvidence: (ids, options) =>
    set({
      evidenceOpen: true,
      evidenceIds: ids,
      activeEvidenceId: options?.activeId ?? ids[0],
      evidenceTitle: options?.title ?? "Evidence",
    }),
  closeEvidence: () => set({ evidenceOpen: false }),
  setActiveEvidence: (activeEvidenceId) => set({ activeEvidenceId }),

  selectIncident: (selectedIncidentId) => set({ selectedIncidentId }),
  selectJourney: (selectedJourneyId) => set({ selectedJourneyId }),
  selectApplication: (selectedApplicationId) => set({ selectedApplicationId }),

  startTurn: (question) => {
    turnCounter += 1;
    const id = `turn-${turnCounter}`;
    set((s) => ({
      conversation: [
        ...s.conversation,
        { id, question, askedAt: new Date().toISOString(), status: "pending" },
      ],
    }));
    return id;
  },
  completeTurn: (id, answer) =>
    set((s) => ({
      conversation: s.conversation.map((t) =>
        t.id === id ? { ...t, answer, status: "answered" } : t,
      ),
    })),
  failTurn: (id, error) =>
    set((s) => ({
      conversation: s.conversation.map((t) => (t.id === id ? { ...t, status: "failed", error } : t)),
    })),
  clearConversation: () => set({ conversation: [] }),
}));
