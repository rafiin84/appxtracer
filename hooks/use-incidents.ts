"use client";

import { getIncident, getIncidentContext, getIncidents, type IncidentContext } from "@/lib/api";
import type { Incident, IncidentsPayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useIncidents() {
  return useApiQuery<IncidentsPayload>(["incidents"], (ctx) => getIncidents(ctx));
}

export function useIncident(id: string | undefined) {
  return useApiQuery<Incident>(
    ["incident", id],
    (ctx) => getIncident(id as string, ctx),
    { enabled: Boolean(id) },
  );
}

export function useIncidentContext(id: string | undefined) {
  return useApiQuery<IncidentContext>(
    ["incident-context", id],
    (ctx) => getIncidentContext(id as string, ctx),
    { enabled: Boolean(id) },
  );
}
