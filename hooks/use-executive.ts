"use client";

import { getExecutiveInsights, getShapeReports, getSources } from "@/lib/api";
import type { ExecutiveInsightsPayload, IngestSource } from "@/types";
import type { ShapeReport } from "@/lib/ontology/shapes";
import { useApiQuery } from "./use-api";

export function useExecutiveInsights() {
  return useApiQuery<ExecutiveInsightsPayload>(["executive-insights"], (ctx) =>
    getExecutiveInsights(ctx),
  );
}

export function useSources() {
  return useApiQuery<IngestSource[]>(["sources"], (ctx) => getSources(ctx));
}

export function useShapeReports() {
  return useApiQuery<ShapeReport[]>(["shape-reports"], (ctx) => getShapeReports(ctx));
}
