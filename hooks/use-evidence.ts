"use client";

import { getEvidence, getEvidenceBundle } from "@/lib/api";
import type { Evidence } from "@/types";
import { useApiQuery } from "./use-api";

export function useEvidenceCorpus() {
  return useApiQuery<Evidence[]>(["evidence"], (ctx) => getEvidence(ctx));
}

export function useEvidenceBundle(ids: string[]) {
  return useApiQuery<Evidence[]>(
    ["evidence-bundle", ids.join(",")],
    (ctx) => getEvidenceBundle(ids, ctx),
    { enabled: ids.length > 0 },
  );
}
