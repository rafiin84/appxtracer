import type { ApiEnvelope, ExecutiveInsightsPayload, IngestSource } from "@/types";
import { buildExecutiveInsights } from "@/lib/mock/insights";
import { INGEST_SOURCES } from "@/lib/mock/company";
import { SHAPES, type ShapeReport } from "@/lib/ontology/shapes";
import { buildApplications } from "@/lib/mock/applications";
import { buildJourneys } from "@/lib/mock/journeys";
import { buildServices } from "@/lib/mock/services";
import { CHANGES } from "@/lib/mock/changes";
import { EVIDENCE } from "@/lib/mock/evidence";
import { ROOT_CAUSES } from "@/lib/mock/causes";
import { respond, type ApiOptions } from "./client";

export async function getExecutiveInsights(
  options: ApiOptions = {},
): Promise<ApiEnvelope<ExecutiveInsightsPayload>> {
  const payload = buildExecutiveInsights();
  return respond("/api/executive-insights", options, () => payload, {
    availability: payload.availability,
    sources: ["APPX Graph", "Nike Revenue Ledger", "ServiceNow", "Datadog"],
  });
}

export async function getSources(options: ApiOptions = {}): Promise<ApiEnvelope<IngestSource[]>> {
  return respond("/api/sources", { ...options, latencyMs: 120 }, () => INGEST_SOURCES);
}

/**
 * Runs the SHACL shapes over the live dataset. These are real results — the
 * proposed journeys genuinely have no owner and no SLO, which is exactly the
 * governance gap the Journeys screen asks a business owner to close.
 */
export async function getShapeReports(
  options: ApiOptions = {},
): Promise<ApiEnvelope<ShapeReport[]>> {
  return respond("/api/ontology/shapes", options, (ctx) => {
    const journeys = buildJourneys(ctx.rangeKey);
    const applications = buildApplications(ctx.rangeKey);
    const services = buildServices(ctx.rangeKey);

    const evaluate = (
      shapeId: string,
      targets: Array<{ id: string; conforms: boolean }>,
    ): ShapeReport => {
      const shape = SHAPES.find((s) => s.id === shapeId)!;
      const violating = targets.filter((t) => !t.conforms);
      return {
        shapeId,
        label: shape.label,
        severity: shape.severity,
        targetClass: shape.targetClass,
        conforming: targets.length - violating.length,
        violating: violating.length,
        violatingIds: violating.map((v) => v.id),
      };
    };

    return [
      evaluate(
        "shape-app-owner",
        applications.map((a) => ({ id: a.id, conforms: Boolean(a.owner) })),
      ),
      evaluate(
        "shape-app-environment",
        applications.map((a) => ({ id: a.id, conforms: Boolean(a.environment) })),
      ),
      evaluate(
        "shape-journey-owner",
        journeys
          .filter((j) => j.criticality === "mission-critical" || j.criticality === "business-critical")
          .map((j) => ({ id: j.id, conforms: Boolean(j.owner) })),
      ),
      evaluate(
        "shape-journey-application",
        journeys.map((j) => ({ id: j.id, conforms: j.applicationIds.length > 0 })),
      ),
      evaluate(
        "shape-journey-slo",
        journeys.map((j) => ({
          id: j.id,
          conforms: j.discovery.state !== "governed" || Boolean(j.slo),
        })),
      ),
      evaluate(
        "shape-journey-validated",
        journeys.map((j) => ({
          id: j.id,
          conforms: j.discovery.state !== "proposed" && Boolean(j.discovery.validatedBy),
        })),
      ),
      evaluate(
        "shape-change-timestamp",
        CHANGES.map((c) => ({ id: c.id, conforms: Boolean(c.at) })),
      ),
      evaluate(
        "shape-change-target",
        CHANGES.map((c) => ({ id: c.id, conforms: c.targetIds.length > 0 })),
      ),
      evaluate(
        "shape-evidence-source",
        EVIDENCE.map((e) => ({ id: e.id, conforms: Boolean(e.source) && Boolean(e.observedAt) })),
      ),
      evaluate(
        "shape-rootcause-confidence",
        ROOT_CAUSES.map((r) => ({
          id: r.id,
          conforms: Boolean(r.confidence) && r.evidenceIds.length > 0,
        })),
      ),
      evaluate(
        "shape-service-infrastructure",
        services.map((s) => ({ id: s.id, conforms: s.infrastructureIds.length > 0 })),
      ),
    ];
  });
}
