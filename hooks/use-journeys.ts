"use client";

import { getJourney, getJourneys } from "@/lib/api";
import type { BusinessJourney, JourneysPayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useJourneys() {
  return useApiQuery<JourneysPayload>(["journeys"], (ctx) => getJourneys(ctx));
}

export function useJourney(id: string | undefined) {
  return useApiQuery<BusinessJourney>(
    ["journey", id],
    (ctx) => getJourney(id as string, ctx),
    { enabled: Boolean(id) },
  );
}
