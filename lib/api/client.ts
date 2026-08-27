import type { ApiEnvelope, Availability, TimeRangeKey } from "@/types";
import { ENVIRONMENTS, DEFAULT_ENVIRONMENT_ID } from "@/lib/mock/company";
import { resolveRange } from "@/lib/mock/time";
import { T } from "@/lib/mock/narrative";
import { createRng } from "@/lib/utils/random";
import { requestContextSchema, type RequestContext, type RequestContextInput } from "./schemas";

/**
 * The mock transport.
 *
 * Everything the UI does goes through `respond`, which adds a deterministic
 * latency so loading states are real rather than theoretical, and wraps the
 * payload in the same envelope a production API would return — including the
 * availability block, so partial data is representable end to end.
 */

export interface ApiOptions extends Partial<RequestContextInput> {
  /** Overrides the simulated latency for tests. */
  latencyMs?: number;
}

export function resolveContext(options: ApiOptions = {}): RequestContext {
  return requestContextSchema.parse({
    environmentId: options.environmentId ?? DEFAULT_ENVIRONMENT_ID,
    rangeKey: options.rangeKey ?? "24h",
    scopes: options.scopes ?? [],
  });
}

/** Deterministic, believable latency — same endpoint, same delay, every time. */
function latencyFor(endpoint: string, rangeKey: TimeRangeKey): number {
  const rng = createRng(`${endpoint}:${rangeKey}`);
  const base = endpoint.includes("graph") || endpoint.includes("impact") ? 260 : 140;
  return Math.round(base + rng() * 180);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const DEFAULT_AVAILABILITY: Availability = { state: "available" };

export async function respond<T>(
  endpoint: string,
  options: ApiOptions,
  produce: (context: RequestContext) => T,
  meta?: { availability?: Availability; sources?: string[] },
): Promise<ApiEnvelope<T>> {
  const context = resolveContext(options);
  await delay(options.latencyMs ?? latencyFor(endpoint, context.rangeKey));

  const environment =
    ENVIRONMENTS.find((e) => e.id === context.environmentId) ?? ENVIRONMENTS[0];

  return {
    data: produce(context),
    meta: {
      generatedAt: T.now,
      environment,
      range: resolveRange(context.rangeKey),
      availability: meta?.availability ?? DEFAULT_AVAILABILITY,
      sources: meta?.sources ?? ["Datadog", "OpenTelemetry", "NovaCart Order Service", "APPX Graph"],
    },
  };
}

export class ApiRequestError extends Error {
  constructor(
    readonly code: "not-found" | "unavailable" | "invalid-request" | "timeout",
    message: string,
    readonly degradedTo?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}
