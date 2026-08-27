import type { BusinessImpact, ImpactCalculationBasis, Money } from "@/types";
import { confidence } from "@/lib/mock/primitives";
import { formatNumber } from "@/lib/formatters";

/**
 * Business-impact calculations live here, once.
 *
 * Two rules are enforced structurally rather than by convention:
 *  1. A modelled figure always ships with its `ImpactCalculationBasis`, so the
 *     "Why this number?" affordance can never be empty.
 *  2. Observed and modelled amounts are separate fields, never summed into one
 *     headline — the UI shows both or shows the modelled one clearly labelled.
 */

export interface ValueAtRiskInput {
  failedTransactions: number;
  averageOrderValue: number;
  currency: Money["currency"];
  /** Evidence backing each observed input. */
  transactionEvidenceId: string;
  aovEvidenceId: string;
  /** Historical basket-recovery range, which is why this is not a loss figure. */
  recoveryRangePct?: [number, number];
}

export function valueAtRisk(input: ValueAtRiskInput): { money: Money; basis: ImpactCalculationBasis } {
  const amount = Math.round(input.failedTransactions * input.averageOrderValue);
  const recovery = input.recoveryRangePct ?? [31, 46];

  return {
    money: { amount, currency: input.currency, provenance: "derived" },
    basis: {
      method: "Failed transactions × trailing average order value",
      formula: `${formatNumber(input.failedTransactions)} failed or abandoned transactions × $${input.averageOrderValue.toFixed(2)} average order value`,
      inputs: [
        {
          label: "Failed or abandoned transactions",
          value: formatNumber(input.failedTransactions),
          provenance: "observed",
        },
        {
          label: "Trailing 7-day average order value",
          value: `$${input.averageOrderValue.toFixed(2)}`,
          provenance: "observed",
        },
      ],
      assumptions: [
        "Every failed or abandoned transaction is counted once, deduplicated across retries by the same customer.",
        `Basket recovery is not modelled: historically ${recovery[0]}–${recovery[1]}% of abandoned baskets are recovered within 24 hours, so the settled loss will be lower than this figure.`,
        "Value is transaction value, not margin.",
      ],
      confidence: confidence(
        0.82,
        "Both inputs are observed. The uncertainty is entirely in recovery behaviour, which this figure deliberately does not assume.",
      ),
      evidenceIds: [input.transactionEvidenceId, input.aovEvidenceId],
    },
  };
}

export interface ConversionImpactInput {
  conversionDropPct: number;
  dailyAttributedRevenue: number;
  hoursAffected: number;
  currency: Money["currency"];
  evidenceIds: string[];
  attributionNote: string;
}

/** For journeys whose revenue link is modelled rather than transactional. */
export function conversionValueAtRisk(
  input: ConversionImpactInput,
): { money: Money; basis: ImpactCalculationBasis } {
  const amount = Math.round(
    (input.dailyAttributedRevenue / 24) * input.hoursAffected * (input.conversionDropPct / 100),
  );
  return {
    money: { amount, currency: input.currency, provenance: "derived" },
    basis: {
      method: "Conversion delta applied to attributed revenue run rate",
      formula: `${input.conversionDropPct.toFixed(1)}% conversion loss × ($${(input.dailyAttributedRevenue / 1_000_000).toFixed(2)}M/day ÷ 24 h) × ${input.hoursAffected.toFixed(1)} h affected`,
      inputs: [
        { label: "Conversion loss", value: `${input.conversionDropPct.toFixed(1)}%`, provenance: "observed" },
        {
          label: "Attributed revenue run rate",
          value: `$${(input.dailyAttributedRevenue / 1_000_000).toFixed(2)}M/day`,
          provenance: "derived",
        },
        { label: "Hours affected", value: `${input.hoursAffected.toFixed(1)} h`, provenance: "observed" },
      ],
      assumptions: [
        input.attributionNote,
        "Assumes affected customers do not convert later through another surface, which some will.",
      ],
      confidence: confidence(
        0.61,
        "The conversion delta is measured, but attributing revenue to a discovery surface is a model, not a ledger fact.",
      ),
      evidenceIds: input.evidenceIds,
    },
  };
}

export interface ImpactInput {
  customersAffected: number;
  customersActive: number;
  transactionsFailed: number;
  transactionsAtRisk: number;
  conversionImpactPct: number;
  from: string;
  to: string;
  estimated: Money;
  basis: ImpactCalculationBasis;
  observedLost?: Money;
  availability: BusinessImpact["availability"];
}

export function businessImpact(input: ImpactInput): BusinessImpact {
  return {
    customersAffected: input.customersAffected,
    customersAffectedPct:
      input.customersActive > 0
        ? Number(((input.customersAffected / input.customersActive) * 100).toFixed(2))
        : 0,
    transactionsFailed: input.transactionsFailed,
    transactionsAtRisk: input.transactionsAtRisk,
    observedValueLost: input.observedLost,
    estimatedValueAtRisk: input.estimated,
    conversionImpactPct: input.conversionImpactPct,
    window: { from: input.from, to: input.to },
    basis: input.basis,
    availability: input.availability,
  };
}
