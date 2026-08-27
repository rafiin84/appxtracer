import type { ApiEnvelope, CommandCenterPayload } from "@/types";
import { buildApplications } from "@/lib/mock/applications";
import { buildJourneys } from "@/lib/mock/journeys";
import { buildImpactSummary, WINDOW_AVAILABILITY, buildGeography } from "@/lib/mock/impact";
import { buildExperience } from "@/lib/mock/experience";
import { ACTIVE_INCIDENTS, INCIDENTS } from "@/lib/mock/incidents";
import { CHANGES } from "@/lib/mock/changes";
import { EMERGING_RISKS, RECOMMENDATIONS, ROOT_CAUSES } from "@/lib/mock/causes";
import { WINDOW_IMPACT, T } from "@/lib/mock/narrative";
import { observed, usd } from "@/lib/mock/primitives";
import { isUnhealthy } from "@/lib/calculations/health";
import { buildSeries, makeTrend } from "@/lib/mock/telemetry";
import { respond, type ApiOptions } from "./client";

const SEVERITY_RANK = { sev1: 0, sev2: 1, sev3: 2, sev4: 3 } as const;

export async function getCommandCenter(
  options: ApiOptions = {},
): Promise<ApiEnvelope<CommandCenterPayload>> {
  return respond(
    "/api/dashboard",
    options,
    (ctx): CommandCenterPayload => {
      const journeys = buildJourneys(ctx.rangeKey);
      const applications = buildApplications(ctx.rangeKey);
      const experience = buildExperience(ctx.rangeKey);
      const impact = buildImpactSummary(ctx.rangeKey);

      const breakingJourneys = journeys
        .filter((j) => isUnhealthy(j.health) && j.discovery.state !== "proposed")
        .sort((a, b) => b.valueAtRisk.amount - a.valueAtRisk.amount || a.healthScore - b.healthScore);

      const applicationsHurtingBusiness = applications
        .filter((a) => isUnhealthy(a.health))
        .sort((a, b) => b.valueAtRisk.amount - a.valueAtRisk.amount || a.healthScore - b.healthScore);

      const activeIncidents = [...ACTIVE_INCIDENTS].sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          b.customersAffected - a.customersAffected,
      );

      const recentChanges = [...CHANGES]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 8);

      const revenueSeries = buildSeries(
        {
          id: "dashboard:revenue",
          label: "Revenue per minute",
          unit: "currency",
          base: 62_400,
          noise: 0.05,
          seasonality: 0.2,
          min: 0,
          events: [{ from: T.journeyDegraded, rampMinutes: 8, multiplier: 0.73 }],
          markers: [
            { t: T.deploy, label: "Payment deployment", kind: "change", refId: "chg-8841" },
            { t: T.incidentOpened, label: "INC-4417", kind: "incident", refId: "inc-4417" },
          ],
        },
        ctx.rangeKey,
      );

      return {
        health: {
          state: "critical",
          score: 38,
          scoreTrend: makeTrend(-54.2, "up-is-good", ctx.rangeKey),
          headline: "Checkout is failing for one in four customers",
          subline:
            "A Payment Service deployment reduced database connection capacity 37 minutes ago. Rolling it back is the single highest-value action, and peak trading begins in 48 minutes.",
          activeIncidentCount: ACTIVE_INCIDENTS.length,
          highestSeverity: "sev1",
          since: T.paymentLatency,
        },
        impact,
        breakingJourneys,
        journeysHealthy: journeys.filter((j) => j.health === "healthy").length,
        journeysTotal: journeys.length,
        applicationsHurtingBusiness,
        applicationsTotal: applications.length,
        activeIncidents,
        recentChanges,
        rootCauses: ROOT_CAUSES.filter((rc) =>
          INCIDENTS.some((i) => i.rootCauseId === rc.id && i.state !== "resolved"),
        ),
        emergingRisks: [...EMERGING_RISKS].sort((a, b) => b.likelihood - a.likelihood),
        recommendations: [...RECOMMENDATIONS].sort((a, b) => a.priority - b.priority).slice(0, 4),
        experience: {
          score: experience.score.value,
          trend: experience.score.trend,
          series: experience.series.experience,
        },
        revenue: {
          observedWindow: observed(41_180_000),
          atRisk: usd(WINDOW_IMPACT.valueAtRisk.amount),
          series: revenueSeries,
          availability: WINDOW_AVAILABILITY,
        },
        geography: buildGeography(),
      };
    },
    {
      availability: WINDOW_AVAILABILITY,
      sources: [
        "ManageEngine OpManager",
        "ManageEngine AppManager",
        "Datadog",
        "Dynatrace",
        "OpenTelemetry",
        "NovaCart Order Service",
        "NovaCart Revenue Ledger",
        "APPX Graph",
      ],
    },
  );
}
