import type { EnvironmentRef, Owner, Region, RegionCode } from "@/types";
import type { IngestSource } from "@/types/api";
import { minutesAgo } from "@/lib/utils/clock";

/**
 * NovaCart — the fictional global commerce platform this demo instance models.
 * ~41.6M monthly active customers across seven regions, 12 applications and
 * 24 services, with the application itself being the entire business.
 */
export const COMPANY = {
  id: "org-novacart",
  name: "NovaCart",
  tagline: "Global commerce platform",
  monthlyActiveCustomers: 41_600_000,
  annualGmv: 18_400_000_000,
  currency: "USD" as const,
  headquarters: "Amsterdam",
};

export const ENVIRONMENTS: EnvironmentRef[] = [
  { id: "env-prod", name: "Production", kind: "production", tenant: "novacart-global" },
  { id: "env-prod-eu", name: "Production · EU", kind: "production", tenant: "novacart-eu" },
  { id: "env-staging", name: "Staging", kind: "staging", tenant: "novacart-global" },
  { id: "env-dr", name: "Disaster recovery", kind: "disaster-recovery", tenant: "novacart-global" },
];

export const DEFAULT_ENVIRONMENT_ID = "env-prod";

export const REGIONS: Record<RegionCode, Region> = {
  "us-east": { code: "us-east", name: "US East", hub: "Ashburn", x: 0.265, y: 0.36 },
  "us-west": { code: "us-west", name: "US West", hub: "Portland", x: 0.155, y: 0.33 },
  "eu-west": { code: "eu-west", name: "EU West", hub: "Dublin", x: 0.462, y: 0.28 },
  "eu-central": { code: "eu-central", name: "EU Central", hub: "Frankfurt", x: 0.512, y: 0.30 },
  "ap-south": { code: "ap-south", name: "AP South", hub: "Mumbai", x: 0.685, y: 0.46 },
  "ap-southeast": { code: "ap-southeast", name: "AP Southeast", hub: "Singapore", x: 0.762, y: 0.55 },
  "sa-east": { code: "sa-east", name: "SA East", hub: "São Paulo", x: 0.335, y: 0.68 },
};

export const REGION_LIST: Region[] = Object.values(REGIONS);

export function regionName(code: RegionCode): string {
  return REGIONS[code]?.name ?? code;
}

/** Teams are the accountable unit; individuals are named but contacted by handle. */
export const OWNERS = {
  checkout: {
    id: "own-checkout",
    name: "Priya Raghunathan",
    role: "Director, Commerce Platform",
    team: "Commerce Platform",
    handle: "#team-commerce-platform",
  },
  payments: {
    id: "own-payments",
    name: "Tomas Lindqvist",
    role: "Principal Engineer, Payments",
    team: "Payments Engineering",
    handle: "#team-payments",
  },
  identity: {
    id: "own-identity",
    name: "Amara Okonkwo",
    role: "Engineering Manager, Identity",
    team: "Identity & Trust",
    handle: "#team-identity",
  },
  discovery: {
    id: "own-discovery",
    name: "Rafael Duarte",
    role: "Director, Discovery",
    team: "Search & Discovery",
    handle: "#team-discovery",
  },
  orders: {
    id: "own-orders",
    name: "Hannah Wexler",
    role: "Engineering Manager, Order Systems",
    team: "Order Systems",
    handle: "#team-orders",
  },
  fulfilment: {
    id: "own-fulfilment",
    name: "Jun-seo Park",
    role: "Director, Fulfilment Technology",
    team: "Fulfilment Technology",
    handle: "#team-fulfilment",
  },
  platform: {
    id: "own-platform",
    name: "Dmitri Volkov",
    role: "Principal SRE",
    team: "Platform Reliability",
    handle: "#team-platform-sre",
  },
  data: {
    id: "own-data",
    name: "Meera Krishnan",
    role: "Head of Data Platform",
    team: "Data Platform",
    handle: "#team-data-platform",
  },
  network: {
    id: "own-network",
    name: "Callum Byrne",
    role: "Principal Network Architect",
    team: "Network Engineering",
    handle: "#team-network",
  },
  security: {
    id: "own-security",
    name: "Yasmin Haddad",
    role: "Director, Security Engineering",
    team: "Security Engineering",
    handle: "#team-security",
  },
  growth: {
    id: "own-growth",
    name: "Elena Marchetti",
    role: "VP, Subscription Business",
    team: "Subscriptions",
    handle: "#team-subscriptions",
  },
  mobile: {
    id: "own-mobile",
    name: "Kofi Mensah",
    role: "Director, Mobile Engineering",
    team: "Mobile Engineering",
    handle: "#team-mobile",
  },
} as const satisfies Record<string, Owner>;

export type OwnerKey = keyof typeof OWNERS;

/**
 * The observability estate APPX Tracer reads from. These are the sensors; the
 * product is the semantic layer above them. Nothing here is replaced.
 */
export const INGEST_SOURCES: IngestSource[] = [
  { id: "src-datadog", system: "Datadog", category: "APM & metrics", status: "connected", entitiesContributed: 4_182, factsContributed: 1_284_000, lastSyncAt: minutesAgo(1), latencySeconds: 42 },
  { id: "src-dynatrace", system: "Dynatrace", category: "APM & real-user monitoring", status: "connected", entitiesContributed: 2_640, factsContributed: 806_400, lastSyncAt: minutesAgo(2), latencySeconds: 65 },
  { id: "src-splunk", system: "Splunk", category: "Logs", status: "connected", entitiesContributed: 1_920, factsContributed: 3_110_000, lastSyncAt: minutesAgo(1), latencySeconds: 88 },
  { id: "src-otel", system: "OpenTelemetry Collector", category: "Distributed tracing", status: "connected", entitiesContributed: 5_410, factsContributed: 9_640_000, lastSyncAt: minutesAgo(1), latencySeconds: 18 },
  { id: "src-aws", system: "AWS CloudWatch", category: "Cloud infrastructure", status: "connected", entitiesContributed: 3_290, factsContributed: 742_000, lastSyncAt: minutesAgo(3), latencySeconds: 120 },
  { id: "src-azure", system: "Azure Monitor", category: "Cloud infrastructure", status: "connected", entitiesContributed: 880, factsContributed: 168_000, lastSyncAt: minutesAgo(4), latencySeconds: 150 },
  { id: "src-gcp", system: "Google Cloud Operations", category: "Cloud infrastructure", status: "degraded", entitiesContributed: 412, factsContributed: 61_000, lastSyncAt: minutesAgo(38), latencySeconds: 2_280 },
  { id: "src-manageengine", system: "ManageEngine OpManager", category: "Network & infrastructure monitoring", status: "connected", entitiesContributed: 1_460, factsContributed: 402_000, lastSyncAt: minutesAgo(2), latencySeconds: 95 },
  { id: "src-appmanager", system: "ManageEngine AppManager", category: "Application performance monitoring", status: "connected", entitiesContributed: 2_180, factsContributed: 918_000, lastSyncAt: minutesAgo(1), latencySeconds: 55 },
  { id: "src-thousandeyes", system: "ThousandEyes", category: "Digital experience monitoring", status: "connected", entitiesContributed: 320, factsContributed: 88_000, lastSyncAt: minutesAgo(2), latencySeconds: 74 },
  { id: "src-panorama", system: "Palo Alto Panorama", category: "Security & firewall", status: "connected", entitiesContributed: 268, factsContributed: 121_000, lastSyncAt: minutesAgo(5), latencySeconds: 210 },
  { id: "src-github", system: "GitHub Actions", category: "Change & deployment", status: "connected", entitiesContributed: 640, factsContributed: 24_800, lastSyncAt: minutesAgo(2), latencySeconds: 30 },
  { id: "src-servicenow", system: "ServiceNow", category: "Change management", status: "connected", entitiesContributed: 510, factsContributed: 19_200, lastSyncAt: minutesAgo(6), latencySeconds: 300 },
  { id: "src-ledger", system: "NovaCart Revenue Ledger", category: "Business & revenue", status: "connected", entitiesContributed: 96, factsContributed: 5_920_000, lastSyncAt: minutesAgo(4), latencySeconds: 240 },
  { id: "src-orders", system: "NovaCart Order Service", category: "Business transactions", status: "connected", entitiesContributed: 140, factsContributed: 8_410_000, lastSyncAt: minutesAgo(1), latencySeconds: 35 },
];
