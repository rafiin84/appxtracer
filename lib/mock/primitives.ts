import type { Confidence, ConfidenceBand, Money } from "@/types";

export function usd(amount: number, provenance: Money["provenance"] = "derived"): Money {
  return { amount, currency: "USD", provenance };
}

export function observed(amount: number): Money {
  return { amount, currency: "USD", provenance: "observed" };
}

function bandFor(value: number): ConfidenceBand {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  return "low";
}

export function confidence(value: number, rationale: string): Confidence {
  return { value, band: bandFor(value), rationale };
}
