"use client";

import { useMemo } from "react";
import type { GraphPath } from "@/types";
import { useEntityIndex } from "@/hooks/use-graph";
import { classLabel } from "@/lib/ontology/classes";
import type { CausalPathNode } from "./causal-path";
import type { GraphNodeKind } from "@/types";

/**
 * Resolves a path's node ids to display nodes. The final hop is marked as the
 * cause so it reads as the end of the chain rather than another step in it.
 */
export function usePathNodes(path?: GraphPath): CausalPathNode[] {
  const { data } = useEntityIndex();
  const index = data?.data;

  return useMemo(() => {
    if (!path) return [];
    return path.nodeIds.map((id, i) => {
      const entry = index?.[id];
      return {
        id,
        label: entry?.label ?? id,
        sublabel: entry ? classLabel(entry.kind as GraphNodeKind) : undefined,
        href: entry?.href,
        tone: i === 0 ? "start" : i === path.nodeIds.length - 1 ? "cause" : "middle",
      } satisfies CausalPathNode;
    });
  }, [path, index]);
}
