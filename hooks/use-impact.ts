"use client";

import { getImpactAnalysis } from "@/lib/api";
import type { BlastRadius, ImpactAnalysisPayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useImpactAnalysis(
  originId: string | undefined,
  scenario: BlastRadius["scenario"] = "total-failure",
) {
  return useApiQuery<ImpactAnalysisPayload>(
    ["impact", originId, scenario],
    (ctx) => getImpactAnalysis({ originId: originId as string, scenario }, ctx),
    { enabled: Boolean(originId) },
  );
}
