import { z } from "zod";

/**
 * Zod at the API boundary.
 *
 * Requests are validated here because they carry user input — a pasted email, a
 * URL parameter, a persisted filter from an older build. Responses are typed by
 * the domain models rather than re-declared as schemas: in Phase 1 the mock
 * layer *is* the source of those types, so a runtime response schema would only
 * restate them. When a real transport lands, `parseResponse` below is the hook
 * to add response validation without touching a caller.
 */

export const timeRangeKeySchema = z.enum(["1h", "6h", "24h", "7d", "30d", "90d"]);

export const environmentIdSchema = z.string().min(1).max(64);

export const requestContextSchema = z.object({
  environmentId: environmentIdSchema.default("env-prod"),
  rangeKey: timeRangeKeySchema.default("24h"),
  /** Scopes the caller holds. Drives PII masking and role-based visibility. */
  scopes: z.array(z.string()).default([]),
});

export type RequestContextInput = z.input<typeof requestContextSchema>;
export type RequestContext = z.output<typeof requestContextSchema>;

export const entityIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, "Entity ids are lowercase kebab-case identifiers");

export const customerSearchSchema = z.object({
  /** An email, customer id, session id or transaction id. */
  term: z.string().trim().min(2, "Enter at least two characters").max(160),
});

export const askSchema = z.object({
  question: z.string().trim().min(3, "Ask a question of at least three characters").max(500),
});

export const graphFilterSchema = z.object({
  kinds: z.array(z.string()).optional(),
  layers: z.array(z.string()).optional(),
  health: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  impactedOnly: z.boolean().optional(),
  query: z.string().max(160).optional(),
  focusId: z.string().max(128).optional(),
  depth: z.number().int().min(1).max(4).optional(),
});

export const blastRadiusSchema = z.object({
  originId: entityIdSchema,
  scenario: z.enum(["current-degradation", "total-failure", "regional-failure"]).default("total-failure"),
});

/** Placeholder for response validation once a real transport is in place. */
export function parseResponse<T>(value: T): T {
  return value;
}
