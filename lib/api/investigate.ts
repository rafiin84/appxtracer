import type {
  ApiEnvelope,
  AskAnswer,
  AskSuggestion,
  BlastRadius,
  Evidence,
  GraphFilter,
  GraphNode,
  GraphQueryResult,
  ImpactAnalysisPayload,
} from "@/types";
import { curatedPath, query as graphQuery, search as graphSearch } from "@/lib/graph/engine";
import { CURATED_PATHS } from "@/lib/mock/paths";
import { EVIDENCE, EVIDENCE_BY_ID, evidenceByIds } from "@/lib/mock/evidence";
import { BLAST_RADIUS_SCENARIOS, buildBlastRadius } from "@/lib/mock/impact";
import { answerQuestion, ASK_SUGGESTIONS } from "@/lib/mock/ask";
import { SPARQL_TEMPLATES, renderSparql } from "@/lib/ontology/sparql";
import { ApiRequestError, respond, type ApiOptions } from "./client";
import { askSchema, blastRadiusSchema, entityIdSchema } from "./schemas";

export async function getGraph(
  filter: GraphFilter = {},
  options: ApiOptions = {},
): Promise<ApiEnvelope<GraphQueryResult>> {
  return respond("/api/graph", options, (ctx): GraphQueryResult => {
    const { snapshot, truncated } = graphQuery(ctx.rangeKey, filter);
    const template = filter.focusId
      ? SPARQL_TEMPLATES.blastRadius
      : SPARQL_TEMPLATES.applicationsAffectingJourney;

    return {
      snapshot,
      paths: CURATED_PATHS,
      query: {
        language: "mock",
        text: renderSparql(template, {
          origin: filter.focusId ?? "journey/checkout",
          journey: filter.focusId ?? "journey/checkout",
          depth: filter.depth ?? 2,
        }),
        description: filter.focusId
          ? `Bounded traversal of depth ${filter.depth ?? 2} around the focused entity, following dependency, routing and change predicates.`
          : "Full estate projection, filtered to the selected entity classes and health states.",
      },
      truncated,
    };
  });
}

export async function searchEntities(
  term: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<GraphNode[]>> {
  return respond("/api/graph/search", options, (ctx) => graphSearch(ctx.rangeKey, term), undefined);
}

export async function getImpactAnalysis(
  input: { originId: string; scenario?: BlastRadius["scenario"] },
  options: ApiOptions = {},
): Promise<ApiEnvelope<ImpactAnalysisPayload>> {
  const parsed = blastRadiusSchema.parse(input);
  return respond("/api/impact", options, (ctx): ImpactAnalysisPayload => {
    const blastRadius = buildBlastRadius(ctx.rangeKey, parsed.originId, parsed.scenario);
    if (!blastRadius) {
      throw new ApiRequestError("not-found", `No entity with id "${parsed.originId}" in the graph.`);
    }
    return { blastRadius, alternatives: BLAST_RADIUS_SCENARIOS };
  });
}

export async function ask(
  question: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<AskAnswer>> {
  const parsed = askSchema.parse({ question });
  return respond(
    "/api/ask",
    { ...options, latencyMs: options.latencyMs ?? 900 },
    (ctx) => {
      const answer = answerQuestion(parsed.question, ctx.rangeKey);
      if (answer.path) {
        // Attach the graph projection for the highlighted path so the answer and
        // the visualisation are guaranteed to show the same evidence set.
        const { snapshot, truncated } = graphQuery(ctx.rangeKey, {
          focusId: answer.path.nodeIds[Math.floor(answer.path.nodeIds.length / 2)],
          depth: 2,
        });
        answer.graph = {
          snapshot,
          paths: [answer.path],
          query: {
            language: "mock",
            text: renderSparql(SPARQL_TEMPLATES.causalPath, {
              from: answer.path.nodeIds[0],
              to: answer.path.nodeIds[answer.path.nodeIds.length - 1],
            }),
            description: "Shortest evidenced path from the affected business entity to the causal attribution.",
          },
          truncated,
        };
      }
      return answer;
    },
    { sources: ["APPX Graph", "Datadog", "OpenTelemetry", "NovaCart Order Service", "GitHub Actions"] },
  );
}

export async function getAskSuggestions(
  options: ApiOptions = {},
): Promise<ApiEnvelope<AskSuggestion[]>> {
  return respond("/api/ask/suggestions", { ...options, latencyMs: 60 }, () => ASK_SUGGESTIONS);
}

export async function getEvidence(options: ApiOptions = {}): Promise<ApiEnvelope<Evidence[]>> {
  return respond("/api/evidence", options, () => EVIDENCE);
}

export async function getEvidenceById(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<Evidence>> {
  const evidenceId = entityIdSchema.parse(id);
  return respond("/api/evidence/:id", { ...options, latencyMs: 80 }, () => {
    const record = EVIDENCE_BY_ID.get(evidenceId);
    if (!record) throw new ApiRequestError("not-found", `No evidence record "${evidenceId}".`);
    return record;
  });
}

export async function getEvidenceBundle(
  ids: string[],
  options: ApiOptions = {},
): Promise<ApiEnvelope<Evidence[]>> {
  return respond("/api/evidence/bundle", { ...options, latencyMs: 90 }, () => evidenceByIds(ids));
}

export async function getPath(
  id: string,
  options: ApiOptions = {},
): Promise<ApiEnvelope<ReturnType<typeof curatedPath>>> {
  return respond("/api/graph/paths/:id", { ...options, latencyMs: 70 }, () => curatedPath(id));
}

export interface EntityIndexEntry {
  id: string;
  label: string;
  kind: string;
  layer: string;
  health: string;
  href?: string;
}

/**
 * A flat id → label index for the whole estate.
 *
 * Causal paths, blast radii and evidence records all reference entities by id.
 * Rather than each screen re-deriving a label, they resolve through this index,
 * which keeps naming identical everywhere an entity appears.
 */
export async function getEntityIndex(
  options: ApiOptions = {},
): Promise<ApiEnvelope<Record<string, EntityIndexEntry>>> {
  return respond("/api/graph/index", { ...options, latencyMs: 90 }, (ctx) => {
    const { snapshot } = graphQuery(ctx.rangeKey, {});
    return Object.fromEntries(
      snapshot.nodes.map((n) => [
        n.id,
        { id: n.id, label: n.label, kind: n.kind, layer: n.layer, health: n.health, href: n.href },
      ]),
    );
  });
}
