"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TimeRangeKey } from "@/types";
import { DEFAULT_ENVIRONMENT_ID } from "@/lib/mock/company";
import { DEFAULT_RANGE_KEY } from "@/lib/mock/time";
import { SCOPES } from "@/lib/api/scopes";

export type ThemePreference = "light" | "dark" | "system";

/**
 * Personas change what the product leads with, not what it hides. A network
 * engineer opening an incident still sees business impact first — they just get
 * the network path expanded by default rather than collapsed.
 */
export type Persona =
  | "cio"
  | "operations"
  | "sre"
  | "network"
  | "security"
  | "cloud"
  | "service-owner";

export const PERSONAS: Array<{ id: Persona; label: string; description: string }> = [
  { id: "cio", label: "CIO / CTO", description: "Business impact first, technical detail on demand." },
  { id: "operations", label: "IT Operations", description: "Where a business-impacting problem originated." },
  { id: "sre", label: "Application / SRE", description: "Traces, services, deployments and dependencies." },
  { id: "network", label: "Network Engineering", description: "Paths, devices, flows and configuration." },
  { id: "security", label: "Security", description: "Policy changes, controls and correlated impact." },
  { id: "cloud", label: "Cloud / Infrastructure", description: "Compute, clusters and cloud resources." },
  { id: "service-owner", label: "Service Owner", description: "Journey health and business outcomes." },
];

/** The slice written to localStorage. Kept explicit so migrations can type it. */
interface PersistedState {
  theme: ThemePreference;
  environmentId: string;
  rangeKey: TimeRangeKey;
  persona: Persona;
  sidebarCollapsed: boolean;
  scopes: string[];
}

const PERSISTED_DEFAULTS: PersistedState = {
  theme: "system",
  environmentId: DEFAULT_ENVIRONMENT_ID,
  rangeKey: DEFAULT_RANGE_KEY,
  persona: "cio",
  sidebarCollapsed: true,
  scopes: [SCOPES.revenue],
};

interface AppState {
  theme: ThemePreference;
  environmentId: string;
  rangeKey: TimeRangeKey;
  persona: Persona;
  sidebarCollapsed: boolean;
  /** Scopes the current viewer holds. Phase 1 has no auth; this models policy. */
  scopes: string[];
  commandPaletteOpen: boolean;

  setTheme: (theme: ThemePreference) => void;
  setEnvironment: (environmentId: string) => void;
  setRange: (rangeKey: TimeRangeKey) => void;
  setPersona: (persona: Persona) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleScope: (scope: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // The sidebar starts collapsed: icons only, so the first thing a CIO sees
      // is their own data rather than the product's own navigation.
      ...PERSISTED_DEFAULTS,
      commandPaletteOpen: false,

      setTheme: (theme) => set({ theme }),
      setEnvironment: (environmentId) => set({ environmentId }),
      setRange: (rangeKey) => set({ rangeKey }),
      setPersona: (persona) => set({ persona }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleScope: (scope) =>
        set((s) => ({
          scopes: s.scopes.includes(scope)
            ? s.scopes.filter((x) => x !== scope)
            : [...s.scopes, scope],
        })),
    }),
    {
      name: "appx-tracer:app",
      // Bumped when a persisted default changes, so a returning viewer gets the
      // new behaviour instead of their stored copy of the old one.
      version: 2,
      migrate: (persisted, version) => {
        const stored = (persisted ?? {}) as Partial<PersistedState>;
        const state = { ...PERSISTED_DEFAULTS, ...stored };
        // v2 collapsed the sidebar by default; discard the stored expansion.
        return version < 2 ? { ...state, sidebarCollapsed: true } : state;
      },
      partialize: (s) => ({
        theme: s.theme,
        environmentId: s.environmentId,
        rangeKey: s.rangeKey,
        persona: s.persona,
        sidebarCollapsed: s.sidebarCollapsed,
        scopes: s.scopes,
      }),
    },
  ),
);

/** The request context every data hook passes to the API layer. */
export function useRequestContext() {
  const environmentId = useAppStore((s) => s.environmentId);
  const rangeKey = useAppStore((s) => s.rangeKey);
  const scopes = useAppStore((s) => s.scopes);
  return { environmentId, rangeKey, scopes };
}
