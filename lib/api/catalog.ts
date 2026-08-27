import type {
  ApiEnvelope,
  Application,
  ApplicationsPayload,
  BusinessJourney,
  ExperiencePayload,
  JourneysPayload,
  Service,
} from "@/types";
import { buildApplications } from "@/lib/mock/applications";
import { buildJourneys } from "@/lib/mock/journeys";
import { buildServices } from "@/lib/mock/services";
import { buildExperience } from "@/lib/mock/experience";
import { WINDOW_AVAILABILITY } from "@/lib/mock/impact";
import { usd } from "@/lib/mock/primitives";
import { ApiRequestError, respond, type ApiOptions } from "./client";
import { entityIdSchema } from "./schemas";

export async function getJourneys(options: ApiOptions = {}): Promise<ApiEnvelope<JourneysPayload>> {
  return respond("/api/journeys", options, (ctx): JourneysPayload => {
    const all = buildJourneys(ctx.rangeKey);
    const governed = all.filter((j) => j.discovery.state !== "proposed");
    const proposed = all.filter((j) => j.discovery.state === "proposed");
    return {
      journeys: governed,
      proposed,
      portfolio: {
        total: all.length,
        governed: all.filter((j) => j.discovery.state === "governed").length,
        validated: all.filter((j) => j.discovery.state === "validated").length,
        proposed: proposed.length,
        breaching: governed.filter(
          (j) => j.slo !== undefined && j.successRatePct < j.slo.successRatePct,
        ).length,
      },
    };
  });
}

export async function getJourney(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<BusinessJourney>> {
  const journeyId = entityIdSchema.parse(id);
  return respond("/api/journeys/:id", options, (ctx) => {
    const journey = buildJourneys(ctx.rangeKey).find((j) => j.id === journeyId);
    if (!journey) {
      throw new ApiRequestError("not-found", `No journey with id "${journeyId}".`);
    }
    return journey;
  });
}

export async function getApplications(
  options: ApiOptions = {},
): Promise<ApiEnvelope<ApplicationsPayload>> {
  return respond("/api/applications", options, (ctx): ApplicationsPayload => {
    const applications = buildApplications(ctx.rangeKey);
    const services = buildServices(ctx.rangeKey);
    return {
      applications,
      services,
      summary: {
        total: applications.length,
        healthy: applications.filter((a) => a.health === "healthy").length,
        degraded: applications.filter((a) => a.health === "degraded" || a.health === "impaired").length,
        critical: applications.filter((a) => a.health === "critical").length,
        totalValueAtRisk: usd(
          // Deduplicated: checkout and payments describe one incident from two
          // layers, so the larger of the pair is taken rather than their sum.
          Math.max(...applications.map((a) => a.valueAtRisk.amount)) +
            applications
              .filter((a) => !["app-payments", "app-checkout", "app-storefront-web", "app-mobile"].includes(a.id))
              .reduce((sum, a) => sum + a.valueAtRisk.amount, 0),
        ),
      },
    };
  });
}

export async function getApplication(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<{ application: Application; services: Service[] }>> {
  const applicationId = entityIdSchema.parse(id);
  return respond("/api/applications/:id", options, (ctx) => {
    const application = buildApplications(ctx.rangeKey).find((a) => a.id === applicationId);
    if (!application) {
      throw new ApiRequestError("not-found", `No application with id "${applicationId}".`);
    }
    const services = buildServices(ctx.rangeKey).filter(
      (s) => application.serviceIds.includes(s.id) || s.applicationId === application.id,
    );
    return { application, services };
  });
}

export async function getExperience(
  options: ApiOptions = {},
): Promise<ApiEnvelope<ExperiencePayload>> {
  return respond(
    "/api/experience",
    options,
    (ctx) => buildExperience(ctx.rangeKey),
    { availability: WINDOW_AVAILABILITY },
  );
}
