"use client";

import { create } from "zustand";
import type { GraphLayer, GraphNodeKind, HealthState } from "@/types";

interface GraphState {
  focusId?: string;
  depth: number;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  highlightedPathId?: string;
  kinds: GraphNodeKind[];
  layers: GraphLayer[];
  health: HealthState[];
  impactedOnly: boolean;
  search: string;
  /** Falls back to the accessible list rendering of the same data. */
  viewMode: "graph" | "list";

  setFocus: (id?: string, depth?: number) => void;
  setDepth: (depth: number) => void;
  selectNode: (id?: string) => void;
  selectEdge: (id?: string) => void;
  highlightPath: (id?: string) => void;
  setKinds: (kinds: GraphNodeKind[]) => void;
  setLayers: (layers: GraphLayer[]) => void;
  setHealth: (health: HealthState[]) => void;
  setImpactedOnly: (value: boolean) => void;
  setSearch: (value: string) => void;
  setViewMode: (mode: "graph" | "list") => void;
  reset: () => void;
}

const INITIAL = {
  focusId: undefined,
  depth: 2,
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  highlightedPathId: undefined,
  kinds: [] as GraphNodeKind[],
  layers: [] as GraphLayer[],
  health: [] as HealthState[],
  impactedOnly: false,
  search: "",
  viewMode: "graph" as const,
};

export const useGraphStore = create<GraphState>()((set) => ({
  ...INITIAL,
  setFocus: (focusId, depth) => set((s) => ({ focusId, depth: depth ?? s.depth, selectedNodeId: focusId })),
  setDepth: (depth) => set({ depth }),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: undefined }),
  selectEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: undefined }),
  highlightPath: (highlightedPathId) => set({ highlightedPathId }),
  setKinds: (kinds) => set({ kinds }),
  setLayers: (layers) => set({ layers }),
  setHealth: (health) => set({ health }),
  setImpactedOnly: (impactedOnly) => set({ impactedOnly }),
  setSearch: (search) => set({ search }),
  setViewMode: (viewMode) => set({ viewMode }),
  reset: () => set(INITIAL),
}));
