"use client";

import { getApplication, getApplications } from "@/lib/api";
import type { Application, ApplicationsPayload, Service } from "@/types";
import { useApiQuery } from "./use-api";

export function useApplications() {
  return useApiQuery<ApplicationsPayload>(["applications"], (ctx) => getApplications(ctx));
}

export function useApplication(id: string | undefined) {
  return useApiQuery<{ application: Application; services: Service[] }>(
    ["application", id],
    (ctx) => getApplication(id as string, ctx),
    { enabled: Boolean(id) },
  );
}
