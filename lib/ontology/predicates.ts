import type { GraphPredicate } from "@/types";

/**
 * OWL property characteristics for each predicate.
 *
 * These are what let the graph answer questions nobody asserted directly: because
 * `dependsOn` is transitive, "which applications ultimately affect Checkout?"
 * traverses arbitrarily deep; because `servedBy` has the inverse `serves`, a
 * service can be asked which journeys it carries without a second index.
 */
export interface PredicateDefinition {
  predicate: GraphPredicate;
  curie: string;
  label: string;
  /** Reading of the edge in the reverse direction. */
  inverseLabel: string;
  inverseCurie: string;
  transitive: boolean;
  symmetric: boolean;
  /** Whether the edge is asserted by a source system or inferred by the graph. */
  defaultProvenance: "observed" | "derived";
  description: string;
}

export const PREDICATES: PredicateDefinition[] = [
  { predicate: "engagesIn", curie: "appx:engagesIn", label: "engages in", inverseLabel: "engaged by", inverseCurie: "appx:engagedBy", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A customer entered this journey in the active window." },
  { predicate: "hasStep", curie: "appx:hasStep", label: "has step", inverseLabel: "step of", inverseCurie: "appx:stepOf", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A journey is composed of ordered steps." },
  { predicate: "servedBy", curie: "appx:servedBy", label: "served by", inverseLabel: "serves", inverseCurie: "appx:serves", transitive: false, symmetric: false, defaultProvenance: "derived", description: "Traces show this application carrying traffic for the journey step." },
  { predicate: "realises", curie: "appx:realises", label: "realises", inverseLabel: "realised by", inverseCurie: "appx:realisedBy", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A business service is delivered through this journey." },
  { predicate: "dependsOn", curie: "appx:dependsOn", label: "depends on", inverseLabel: "supports", inverseCurie: "appx:supports", transitive: true, symmetric: false, defaultProvenance: "observed", description: "Failure or slowdown of the object degrades the subject." },
  { predicate: "calls", curie: "appx:calls", label: "calls", inverseLabel: "called by", inverseCurie: "appx:calledBy", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A synchronous request path observed in distributed traces." },
  { predicate: "persistsTo", curie: "appx:persistsTo", label: "persists to", inverseLabel: "stores for", inverseCurie: "appx:storesFor", transitive: false, symmetric: false, defaultProvenance: "observed", description: "The subject reads or writes its system of record here." },
  { predicate: "publishesTo", curie: "appx:publishesTo", label: "publishes to", inverseLabel: "consumed by", inverseCurie: "appx:consumedBy", transitive: false, symmetric: false, defaultProvenance: "observed", description: "Asynchronous handoff through a message channel." },
  { predicate: "cachedBy", curie: "appx:cachedBy", label: "cached by", inverseLabel: "caches", inverseCurie: "appx:caches", transitive: false, symmetric: false, defaultProvenance: "observed", description: "Responses are fronted by this cache or edge tier." },
  { predicate: "deployedOn", curie: "appx:deployedOn", label: "deployed on", inverseLabel: "hosts", inverseCurie: "appx:hosts", transitive: false, symmetric: false, defaultProvenance: "observed", description: "The runtime placement of a workload." },
  { predicate: "hostedOn", curie: "appx:hostedOn", label: "hosted on", inverseLabel: "hosts", inverseCurie: "appx:hosts", transitive: true, symmetric: false, defaultProvenance: "observed", description: "Physical or virtual containment, transitively resolvable to a region." },
  { predicate: "runsIn", curie: "appx:runsIn", label: "runs in", inverseLabel: "contains", inverseCurie: "appx:contains", transitive: true, symmetric: false, defaultProvenance: "observed", description: "Placement within a cloud region or availability zone." },
  { predicate: "routesThrough", curie: "appx:routesThrough", label: "routes through", inverseLabel: "carries", inverseCurie: "appx:carries", transitive: false, symmetric: false, defaultProvenance: "observed", description: "Traffic for the subject traverses this network element." },
  { predicate: "connectedTo", curie: "appx:connectedTo", label: "connected to", inverseLabel: "connected to", inverseCurie: "appx:connectedTo", transitive: false, symmetric: true, defaultProvenance: "observed", description: "A physical or logical network adjacency." },
  { predicate: "protectedBy", curie: "appx:protectedBy", label: "protected by", inverseLabel: "protects", inverseCurie: "appx:protects", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A security control sits in front of the subject." },
  { predicate: "affects", curie: "appx:affects", label: "affects", inverseLabel: "affected by", inverseCurie: "appx:affectedBy", transitive: false, symmetric: false, defaultProvenance: "derived", description: "The graph attributed measurable degradation of the object to this incident." },
  { predicate: "changedBy", curie: "appx:changedBy", label: "changed by", inverseLabel: "changed", inverseCurie: "appx:changed", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A change record names this entity as a target." },
  { predicate: "causedBy", curie: "appx:causedBy", label: "caused by", inverseLabel: "caused", inverseCurie: "appx:caused", transitive: false, symmetric: false, defaultProvenance: "derived", description: "The strongest supported causal attribution, always carrying a confidence." },
  { predicate: "correlatesWith", curie: "appx:correlatesWith", label: "correlates with", inverseLabel: "correlates with", inverseCurie: "appx:correlatesWith", transitive: false, symmetric: true, defaultProvenance: "derived", description: "Temporal and topological co-occurrence — correlation, explicitly not causation." },
  { predicate: "evidencedBy", curie: "appx:evidencedBy", label: "evidenced by", inverseLabel: "evidence for", inverseCurie: "appx:evidenceFor", transitive: false, symmetric: false, defaultProvenance: "observed", description: "A retrievable fact backing the assertion." },
];

export const PREDICATE_BY_NAME = new Map<GraphPredicate, PredicateDefinition>(
  PREDICATES.map((p) => [p.predicate, p]),
);

export function predicateLabel(predicate: GraphPredicate): string {
  return PREDICATE_BY_NAME.get(predicate)?.label ?? predicate;
}

export function inverseLabel(predicate: GraphPredicate): string {
  return PREDICATE_BY_NAME.get(predicate)?.inverseLabel ?? `inverse of ${predicate}`;
}

/** Predicates the impact engine walks when computing a blast radius. */
export const IMPACT_PREDICATES: GraphPredicate[] = [
  "hasStep",
  "dependsOn",
  "calls",
  "persistsTo",
  "publishesTo",
  "cachedBy",
  "deployedOn",
  "hostedOn",
  "routesThrough",
  "servedBy",
  "realises",
];
