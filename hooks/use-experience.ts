"use client";

import { getExperience } from "@/lib/api";
import type { ExperiencePayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useExperience() {
  return useApiQuery<ExperiencePayload>(["experience"], (ctx) => getExperience(ctx));
}
