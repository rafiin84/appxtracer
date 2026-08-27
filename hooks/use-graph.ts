"use client";

import { useMemo } from "react";
import { getEntityIndex, getGraph, searchEntities } from "@/lib/api";
import type { GraphFilter, GraphNode, GraphQueryResult } from "@/types";
import { useGraphStore } from "@/stores/graph-store";
import { useApiQuery } from "./use-api";

export function useGraph(overrides?: GraphFilter) {
  const kinds = useGraphStore((s) => s.kinds);
  const layers = useGraphStore((s) => s.layers);
  const health = useGraphStore((s) => s.health);
  const impactedOnly = useGraphStore((s) => s.impactedOnly);
  const search = useGraphStore((s) => s.search);
  const focusId = useGraphStore((s) => s.focusId);
  const depth = useGraphStore((s) => s.depth);

  const filter = useMemo<GraphFilter>(
    () => ({
      kinds: kinds.length ? kinds : undefined,
      layers: layers.length ? layers : undefined,
      health: health.length ? health : undefined,
      impactedOnly: impactedOnly || undefined,
      query: search.trim() || undefined,
      focusId,
      depth,
      ...overrides,
    }),
    [kinds, layers, health, impactedOnly, search, focusId, depth, overrides],
  );

  return useApiQuery<GraphQueryResult>(
    ["graph", JSON.stringify(filter)],
    (ctx) => getGraph(filter, ctx),
  );
}

export function useEntitySearch(term: string) {
  return useApiQuery<GraphNode[]>(
    ["entity-search", term.trim().toLowerCase()],
    (ctx) => searchEntities(term, ctx),
    { enabled: term.trim().length >= 2 },
  );
}

export function useEntityIndex() {
  return useApiQuery<Record<string, import("@/lib/api").EntityIndexEntry>>(
    ["entity-index"],
    (ctx) => getEntityIndex(ctx),
    { staleTime: 5 * 60_000 },
  );
}
