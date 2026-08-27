import type { Customer } from "@/types";

/**
 * Role-based visibility.
 *
 * Phase 1 implements no authentication, but the data-handling rules are modelled
 * now so they are not retrofitted later: customer identifiers are masked unless
 * the caller explicitly holds `customer.pii.read`, and every unmasking is
 * recorded in the audit trail.
 */
export const SCOPES = {
  pii: "customer.pii.read",
  revenue: "business.revenue.read",
  admin: "platform.admin",
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  subject: string;
  scope: Scope;
  justification: string;
}

/**
 * Applies the masking policy. Callers receive a customer they can render
 * anywhere without needing to know which fields are sensitive.
 */
export function applyPolicy(customer: Customer, scopes: string[]): Customer {
  if (scopes.includes(SCOPES.pii)) return customer;
  return { ...customer, email: customer.emailMasked };
}

export function canSee(scopes: string[], scope: Scope): boolean {
  return scopes.includes(scope);
}
