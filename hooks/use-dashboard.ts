"use client";

import { getCommandCenter } from "@/lib/api";
import type { CommandCenterPayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useCommandCenter() {
  return useApiQuery<CommandCenterPayload>(["command-center"], (ctx) => getCommandCenter(ctx));
}
