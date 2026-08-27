"use client";

import { getChange, getChanges } from "@/lib/api";
import type { Change, ChangesPayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useChanges() {
  return useApiQuery<ChangesPayload>(["changes"], (ctx) => getChanges(ctx));
}

export function useChange(id: string | undefined) {
  return useApiQuery<Change>(
    ["change", id],
    (ctx) => getChange(id as string, ctx),
    { enabled: Boolean(id) },
  );
}
