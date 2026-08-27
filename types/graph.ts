import type {
  Confidence,
  HealthState,
  ISODateTime,
  Provenance,
  RegionCode,
} from "./core";

/**
 * Node classes mirror the ontology in `lib/ontology`. They are the RDFS classes
 * the semantic layer would expose (`appx:Application rdfs:subClassOf appx:SoftwareEntity`),
 * flattened here to the labels the UI needs to render and filter on.
 */
export type GraphNodeKind =
  | "customer"
  | "segment"
  | "journey"
  | "journey-step"
  | "business-service"
  | "application"
  | "api"
  | "service"
  | "database"
  | "queue"
  | "cache"
  | "cdn"
  | "third-party"
  | "server"
  | "vm"
  | "container"
  | "kubernetes-cluster"
  | "cloud-resource"
  | "network-device"
  | "interface"
  | "firewall"
  | "load-balancer"
  | "security-control"
  | "change"
  | "incident"
  | "evidence";

/** The layer a node belongs to — drives grouping, colour and the map's rings. */
export type GraphLayer =
  | "business"
  | "experience"
  | "application"
  | "platform"
  | "infrastructure"
  | "operations";

/**
 * Predicates are the RDF properties the semantic layer asserts. Each carries an
 * inverse and, where relevant, transitivity — see `lib/ontology/predicates.ts`.
 */
export type GraphPredicate =
  | "engagesIn" // Customer -> Journey
  | "hasStep" // Journey -> JourneyStep
  | "servedBy" // Journey/Step -> Application
  | "realises" // BusinessService -> Journey
  | "dependsOn" // Application/Service -> Service (transitive)
  | "calls" // Application -> API/Service
  | "persistsTo" // Service -> Database
  | "publishesTo" // Service -> Queue
  | "cachedBy"
  | "deployedOn" // Service -> Container/VM/Cluster
  | "hostedOn" // Container -> Cluster/Server
  | "runsIn" // any -> CloudResource
  | "routesThrough" // Application/Service -> NetworkDevice/Firewall
  | "connectedTo" // NetworkDevice -> Interface/NetworkDevice
  | "protectedBy" // any -> Firewall/SecurityControl
  | "affects" // Incident -> anything (derived)
  | "changedBy" // any -> Change
  | "causedBy" // Incident/degradation -> root cause (derived)
  | "correlatesWith" // Change -> Incident (derived)
  | "evidencedBy"; // any -> Evidence

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  layer: GraphLayer;
  health: HealthState;
  /** Business criticality 0–1, used to size nodes without shouting. */
  weight: number;
  region?: RegionCode;
  /** Route within the app for "open this entity". */
  href?: string;
  /** Compact facts rendered in the inspector without another fetch. */
  facts: Array<{ label: string; value: string }>;
  /** True when the node is only asserted by inference, not observed directly. */
  inferred?: boolean;
  incidentIds?: string[];
  changeIds?: string[];
  evidenceIds?: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  predicate: GraphPredicate;
  label: string;
  provenance: Provenance;
  confidence?: Confidence;
  health?: HealthState;
  /** Edge weight 0–1: how much of the caller's behaviour flows here. */
  weight?: number;
  evidenceIds?: string[];
  assertedAt?: ISODateTime;
  source?: string;
}

export interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: ISODateTime;
  /** Total counts before any filtering, so the UI can say what it hid. */
  totals: { nodes: number; edges: number };
}

export type GraphPathKind = "causal" | "dependency" | "incident" | "experience" | "network";

export interface GraphPath {
  id: string;
  kind: GraphPathKind;
  label: string;
  /** Ordered node ids, start to end. */
  nodeIds: string[];
  /** Ordered edge ids matching the node sequence. */
  edgeIds: string[];
  /** Plain-language narration, one line per hop — the accessible alternative. */
  narration: string[];
  confidence?: Confidence;
  evidenceIds: string[];
}

export interface GraphFilter {
  kinds?: GraphNodeKind[];
  layers?: GraphLayer[];
  health?: HealthState[];
  /** Only keep nodes that carry business impact in the active window. */
  impactedOnly?: boolean;
  regions?: RegionCode[];
  query?: string;
  /** Focus node plus traversal depth. */
  focusId?: string;
  depth?: number;
}

/**
 * The shape a SPARQL-backed traversal service would return. The mock graph
 * engine in `lib/graph` implements exactly this interface so the transport can
 * be swapped without touching a component.
 */
export interface GraphQueryResult {
  snapshot: GraphSnapshot;
  paths: GraphPath[];
  /** The conceptual query that produced this result, shown in the evidence drawer. */
  query: {
    language: "sparql" | "mock";
    text: string;
    description: string;
  };
  truncated: boolean;
}
