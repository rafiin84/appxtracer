/**
 * Conceptual SPARQL for the questions the product answers.
 *
 * The mock graph engine executes an in-memory traversal, but every traversal is
 * paired with the query it stands in for. That query text is shown in the
 * evidence drawer ("how this was answered"), and it is the contract a real
 * triple-store backend would implement — swapping the engine means running these
 * strings rather than rewriting the callers.
 */
export interface SparqlTemplate {
  id: string;
  question: string;
  description: string;
  text: string;
  /** Bindings the caller must supply. */
  parameters: string[];
}

const PREFIXES = `PREFIX appx: <https://appx.tracer/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>`;

export const SPARQL_TEMPLATES: Record<string, SparqlTemplate> = {
  applicationsAffectingJourney: {
    id: "applicationsAffectingJourney",
    question: "Which applications ultimately affect this journey?",
    description:
      "Walks servedBy from the journey, then the transitive closure of dependsOn, keeping anything currently unhealthy.",
    parameters: ["journey"],
    text: `${PREFIXES}

SELECT ?application ?health ?distance WHERE {
  ?journey a appx:BusinessJourney ; appx:hasStep ?step .
  ?step appx:servedBy ?application .
  ?application appx:dependsOn* ?downstream .
  ?downstream appx:health ?health .
  FILTER (?health != "healthy")
  VALUES ?journey { <{{journey}}> }
}
ORDER BY ?distance`,
  },
  journeysDependingOnEntity: {
    id: "journeysDependingOnEntity",
    question: "Which journeys depend on this entity?",
    description:
      "Inverts the dependency closure from an infrastructure or data entity back up to the business layer.",
    parameters: ["entity"],
    text: `${PREFIXES}

SELECT DISTINCT ?journey ?criticality ?valueAtRisk WHERE {
  ?service appx:dependsOn+ <{{entity}}> .
  ?step appx:servedBy ?service .
  ?journey appx:hasStep ?step ; appx:criticality ?criticality .
  OPTIONAL { ?journey appx:valueAtRisk ?valueAtRisk }
}
ORDER BY DESC(?valueAtRisk)`,
  },
  customersAffectedByService: {
    id: "customersAffectedByService",
    question: "Which customers are affected by this service?",
    description:
      "Joins observed sessions to the journeys a degraded service serves, within the incident window.",
    parameters: ["service", "from", "to"],
    text: `${PREFIXES}

SELECT (COUNT(DISTINCT ?customer) AS ?customers) ?journey WHERE {
  ?customer appx:engagesIn ?journeyInstance .
  ?journeyInstance appx:ofJourney ?journey ; appx:at ?at .
  ?journey appx:hasStep/appx:servedBy/appx:dependsOn* <{{service}}> .
  ?journeyInstance appx:outcome ?outcome .
  FILTER (?outcome != "completed")
  FILTER (?at >= "{{from}}"^^xsd:dateTime && ?at <= "{{to}}"^^xsd:dateTime)
}
GROUP BY ?journey`,
  },
  changesCorrelatedWithIncident: {
    id: "changesCorrelatedWithIncident",
    question: "What changed before this incident?",
    description:
      "Finds changes touching any entity inside the incident's blast radius within the correlation window.",
    parameters: ["incident", "windowMinutes"],
    text: `${PREFIXES}

SELECT ?change ?at ?leadTime ?entity WHERE {
  <{{incident}}> appx:affects ?entity ; appx:startedAt ?incidentStart .
  ?entity appx:changedBy ?change .
  ?change appx:at ?at .
  BIND ((?incidentStart - ?at) AS ?leadTime)
  FILTER (?leadTime > 0 && ?leadTime <= "PT{{windowMinutes}}M"^^xsd:duration)
}
ORDER BY DESC(?at)`,
  },
  servicesTraversingNetworkElement: {
    id: "servicesTraversingNetworkElement",
    question: "Which business services traverse this network element?",
    description:
      "Follows routesThrough upward through the application layer to the business services affected.",
    parameters: ["element"],
    text: `${PREFIXES}

SELECT DISTINCT ?businessService ?journey WHERE {
  ?service appx:routesThrough <{{element}}> .
  ?step appx:servedBy ?service .
  ?journey appx:hasStep ?step .
  ?businessService appx:realises ?journey .
}`,
  },
  blastRadius: {
    id: "blastRadius",
    question: "If this fails, what breaks?",
    description:
      "Bounded inverse traversal of the impact predicates, annotating each reached entity with hop distance.",
    parameters: ["origin", "depth"],
    text: `${PREFIXES}

SELECT ?entity ?class ?distance ?customers ?valueAtRisk WHERE {
  <{{origin}}> (^appx:dependsOn|^appx:calls|^appx:persistsTo|^appx:routesThrough|^appx:deployedOn){1,{{depth}}} ?entity .
  ?entity a ?class .
  OPTIONAL { ?entity appx:customersAffected ?customers }
  OPTIONAL { ?entity appx:valueAtRisk ?valueAtRisk }
}
ORDER BY ?distance DESC(?valueAtRisk)`,
  },
  causalPath: {
    id: "causalPath",
    question: "Why is this happening?",
    description:
      "Shortest evidenced path from the affected business entity down to the strongest causal attribution.",
    parameters: ["from", "to"],
    text: `${PREFIXES}

SELECT ?hop ?predicate ?evidence ?confidence WHERE {
  <{{from}}> (appx:servedBy|appx:dependsOn|appx:persistsTo|appx:changedBy|appx:causedBy)+ <{{to}}> .
  ?hop appx:evidencedBy ?evidence .
  OPTIONAL { ?hop appx:confidence ?confidence }
}`,
  },
  customerTrace: {
    id: "customerTrace",
    question: "Trace this customer.",
    description:
      "Resolves a customer to their sessions, interactions and the application path each request took.",
    parameters: ["customer", "from", "to"],
    text: `${PREFIXES}

SELECT ?session ?interaction ?application ?service ?status ?at WHERE {
  <{{customer}}> appx:hasSession ?session .
  ?session appx:hasInteraction ?interaction .
  ?interaction appx:at ?at ; appx:status ?status .
  OPTIONAL { ?interaction appx:handledBy ?application . ?application appx:calls* ?service }
  FILTER (?at >= "{{from}}"^^xsd:dateTime && ?at <= "{{to}}"^^xsd:dateTime)
}
ORDER BY ?at`,
  },
};

export function renderSparql(
  template: SparqlTemplate,
  bindings: Record<string, string | number>,
): string {
  return template.text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    String(bindings[key] ?? `?${key}`),
  );
}
