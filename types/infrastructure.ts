import type { HealthState, ISODateTime, Owner, RegionCode } from "./core";

export type InfrastructureKind =
  | "server"
  | "vm"
  | "container"
  | "kubernetes-cluster"
  | "cloud-resource"
  | "network-device"
  | "interface"
  | "firewall"
  | "load-balancer"
  | "security-control";

export type CloudProvider = "aws" | "azure" | "gcp" | "on-premise";

/**
 * One node of the infrastructure layer. Deliberately a single discriminated
 * shape: the CIO-facing surfaces never enumerate these directly, and the
 * investigation surfaces care about relationships far more than per-kind fields.
 */
export interface InfrastructureNode {
  id: string;
  name: string;
  kind: InfrastructureKind;
  provider: CloudProvider;
  region: RegionCode;
  zone?: string;
  health: HealthState;
  owner: Owner;
  /** Services or applications that run on / traverse this node. */
  supportsIds: string[];
  dependencyIds: string[];
  attributes: InfrastructureAttributes;
  incidentIds: string[];
  changeIds: string[];
  lastChangedAt?: ISODateTime;
}

/** Kind-specific detail, surfaced only inside investigation views. */
export interface InfrastructureAttributes {
  cpuUtilPct?: number;
  memoryUtilPct?: number;
  connectionPoolUtilPct?: number;
  diskUtilPct?: number;
  replicaCount?: number;
  desiredReplicas?: number;
  nodeCount?: number;
  throughputMbps?: number;
  packetLossPct?: number;
  latencyMs?: number;
  errorsPerMinute?: number;
  ruleCount?: number;
  blockedFlowsPerMinute?: number;
  instanceType?: string;
  engine?: string;
  version?: string;
  /** Coarse addressing only; never a customer-identifying address. */
  cidr?: string;
  interfaceName?: string;
}

export interface NetworkPathHop {
  order: number;
  nodeId: string;
  name: string;
  kind: InfrastructureKind;
  latencyMs: number;
  packetLossPct: number;
  health: HealthState;
}
