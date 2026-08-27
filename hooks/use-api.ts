"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiEnvelope } from "@/types";
import { useRequestContext } from "@/stores/app-store";

/**
 * The single place a screen becomes data-bound.
 *
 * Every hook below keys on the request context (environment, window, scopes) so
 * changing the time range or the environment refetches exactly what depends on
 * it and nothing else.
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  fetcher: (ctx: ReturnType<typeof useRequestContext>) => Promise<ApiEnvelope<T>>,
  options?: Omit<UseQueryOptions<ApiEnvelope<T>, Error>, "queryKey" | "queryFn">,
) {
  const ctx = useRequestContext();
  return useQuery<ApiEnvelope<T>, Error>({
    queryKey: [...key, ctx.environmentId, ctx.rangeKey, ctx.scopes.join(",")],
    queryFn: () => fetcher(ctx),
    ...options,
  });
}
