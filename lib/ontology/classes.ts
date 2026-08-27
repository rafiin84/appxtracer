import type { GraphLayer, GraphNodeKind } from "@/types";

/**
 * The RDFS class hierarchy APPX Tracer models.
 *
 * In production this is served by the ontology service as real RDFS triples
 * (`appx:Firewall rdfs:subClassOf appx:NetworkDevice`). Here it is a plain table
 * so the UI can reason about classes — grouping the Digital Map, deciding which
 * filters to offer, explaining an entity in words — without a triple store.
 */
export interface OntologyClass {
  /** CURIE as it would appear in the graph, e.g. `appx:Application`. */
  curie: string;
  kind: GraphNodeKind;
  label: string;
  plural: string;
  layer: GraphLayer;
  /** Parent class CURIE. `null` for the layer roots. */
  subClassOf: string | null;
  definition: string;
}

export const ONTOLOGY_CLASSES: OntologyClass[] = [
  // Business layer
  { curie: "appx:Customer", kind: "customer", label: "Customer", plural: "Customers", layer: "business", subClassOf: "appx:BusinessEntity", definition: "A person or organisation whose experience of the app is measured." },
  { curie: "appx:Segment", kind: "segment", label: "Segment", plural: "Segments", layer: "business", subClassOf: "appx:BusinessEntity", definition: "A named cohort of customers sharing a region, tier, device or app version." },
  { curie: "appx:BusinessJourney", kind: "journey", label: "Journey", plural: "Journeys", layer: "business", subClassOf: "appx:BusinessEntity", definition: "An end-to-end outcome a customer is trying to achieve, such as completing a purchase." },
  { curie: "appx:JourneyStep", kind: "journey-step", label: "Journey step", plural: "Journey steps", layer: "business", subClassOf: "appx:BusinessJourney", definition: "One stage of a journey, with its own success rate and drop-off." },
  { curie: "appx:BusinessService", kind: "business-service", label: "Business service", plural: "Business services", layer: "business", subClassOf: "appx:BusinessEntity", definition: "A capability the business sells or depends on, realised by one or more journeys." },

  // Application layer
  { curie: "appx:Application", kind: "application", label: "Application", plural: "Applications", layer: "application", subClassOf: "appx:SoftwareEntity", definition: "A deployable product surface — a storefront, a mobile app, an API estate." },
  { curie: "appx:API", kind: "api", label: "API", plural: "APIs", layer: "application", subClassOf: "appx:SoftwareEntity", definition: "A network-addressable contract exposed by an application." },
  { curie: "appx:Service", kind: "service", label: "Service", plural: "Services", layer: "application", subClassOf: "appx:SoftwareEntity", definition: "An independently deployed unit of application logic." },
  { curie: "appx:ThirdPartyService", kind: "third-party", label: "Third-party service", plural: "Third-party services", layer: "application", subClassOf: "appx:Service", definition: "A service operated by an external vendor and consumed over the network." },

  // Platform layer
  { curie: "appx:Database", kind: "database", label: "Database", plural: "Databases", layer: "platform", subClassOf: "appx:DataStore", definition: "A durable store of record." },
  { curie: "appx:Queue", kind: "queue", label: "Queue", plural: "Queues", layer: "platform", subClassOf: "appx:DataStore", definition: "An asynchronous message channel between services." },
  { curie: "appx:Cache", kind: "cache", label: "Cache", plural: "Caches", layer: "platform", subClassOf: "appx:DataStore", definition: "A volatile store fronting a slower system." },
  { curie: "appx:CDN", kind: "cdn", label: "CDN", plural: "CDNs", layer: "platform", subClassOf: "appx:NetworkEntity", definition: "An edge delivery network serving static and cached responses." },

  // Infrastructure layer
  { curie: "appx:Server", kind: "server", label: "Server", plural: "Servers", layer: "infrastructure", subClassOf: "appx:ComputeEntity", definition: "A physical or dedicated host." },
  { curie: "appx:VM", kind: "vm", label: "Virtual machine", plural: "Virtual machines", layer: "infrastructure", subClassOf: "appx:ComputeEntity", definition: "A virtualised host instance." },
  { curie: "appx:Container", kind: "container", label: "Container", plural: "Containers", layer: "infrastructure", subClassOf: "appx:ComputeEntity", definition: "An isolated process bundle scheduled onto a cluster." },
  { curie: "appx:KubernetesCluster", kind: "kubernetes-cluster", label: "Kubernetes cluster", plural: "Kubernetes clusters", layer: "infrastructure", subClassOf: "appx:ComputeEntity", definition: "A scheduler managing containerised workloads across nodes." },
  { curie: "appx:CloudResource", kind: "cloud-resource", label: "Cloud resource", plural: "Cloud resources", layer: "infrastructure", subClassOf: "appx:ComputeEntity", definition: "A provider-managed resource: a region, an availability zone, a managed service." },
  { curie: "appx:NetworkDevice", kind: "network-device", label: "Network device", plural: "Network devices", layer: "infrastructure", subClassOf: "appx:NetworkEntity", definition: "A router, switch or gateway carrying traffic between segments." },
  { curie: "appx:Interface", kind: "interface", label: "Interface", plural: "Interfaces", layer: "infrastructure", subClassOf: "appx:NetworkEntity", definition: "A port on a network device." },
  { curie: "appx:LoadBalancer", kind: "load-balancer", label: "Load balancer", plural: "Load balancers", layer: "infrastructure", subClassOf: "appx:NetworkEntity", definition: "A device distributing requests across service instances." },
  { curie: "appx:Firewall", kind: "firewall", label: "Firewall", plural: "Firewalls", layer: "infrastructure", subClassOf: "appx:NetworkDevice", definition: "A policy enforcement point between network zones." },
  { curie: "appx:SecurityControl", kind: "security-control", label: "Security control", plural: "Security controls", layer: "infrastructure", subClassOf: "appx:NetworkEntity", definition: "A WAF, bot-management or access-control mechanism guarding an application." },

  // Operations layer
  { curie: "appx:Change", kind: "change", label: "Change", plural: "Changes", layer: "operations", subClassOf: "appx:OperationalEvent", definition: "A deliberate modification to the estate: a deployment, a configuration edit, a policy update." },
  { curie: "appx:Incident", kind: "incident", label: "Incident", plural: "Incidents", layer: "operations", subClassOf: "appx:OperationalEvent", definition: "A period of business-impacting degradation, with a lifecycle and an owner." },
  { curie: "appx:Evidence", kind: "evidence", label: "Evidence", plural: "Evidence", layer: "operations", subClassOf: "appx:Knowledge", definition: "A single retrievable fact backing a claim, carrying its source and timestamp." },
];

export const CLASS_BY_KIND = new Map<GraphNodeKind, OntologyClass>(
  ONTOLOGY_CLASSES.map((c) => [c.kind, c]),
);

export function classLabel(kind: GraphNodeKind): string {
  return CLASS_BY_KIND.get(kind)?.label ?? kind;
}

export function classPlural(kind: GraphNodeKind): string {
  return CLASS_BY_KIND.get(kind)?.plural ?? kind;
}

export function layerOf(kind: GraphNodeKind): GraphLayer {
  return CLASS_BY_KIND.get(kind)?.layer ?? "application";
}

export const LAYER_LABEL: Record<GraphLayer, string> = {
  business: "Business",
  experience: "Experience",
  application: "Application",
  platform: "Platform & data",
  infrastructure: "Infrastructure & network",
  operations: "Operations",
};

/** The order the Digital Map stacks its rings in, business closest to the reader. */
export const LAYER_ORDER: GraphLayer[] = [
  "business",
  "experience",
  "application",
  "platform",
  "infrastructure",
  "operations",
];
