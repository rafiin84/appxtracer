import type { GraphPath } from "@/types";
import { confidence } from "./primitives";

/**
 * Curated causal paths.
 *
 * A generic shortest path through the graph is often technically correct and
 * narratively useless. For the scenarios the product leads with, the path is
 * authored — including the sentence for each hop, which doubles as the
 * accessible alternative to the highlighted graph.
 */
export const CURATED_PATHS: GraphPath[] = [
  {
    id: "path-checkout-causal",
    kind: "causal",
    label: "Customer → Checkout → Payments → Database → Deployment",
    nodeIds: [
      "cust-88213",
      "jny-checkout",
      "stp-checkout-pay",
      "app-checkout",
      "app-payments",
      "svc-payment-service",
      "db-payments-primary",
      "rds-payments-primary",
      "chg-8841",
    ],
    edgeIds: [
      "cust-88213--engagesIn--jny-checkout",
      "jny-checkout--hasStep--stp-checkout-pay",
      "stp-checkout-pay--servedBy--app-checkout",
      "app-checkout--dependsOn--app-payments",
      "app-payments--calls--svc-payment-service",
      "svc-payment-service--persistsTo--db-payments-primary",
      "db-payments-primary--deployedOn--rds-payments-primary",
      "rds-payments-primary--changedBy--chg-8841",
    ],
    narration: [
      "18,420 customers entered Complete Checkout and reached the payment step.",
      "The payment step is served by Checkout API, which calls the Payments Platform to authorise.",
      "Payments Platform routes every authorisation through Payment Service.",
      "Payment Service acquires a connection from the payments primary database on each authorisation.",
      "The database pool has been at 97% utilisation since 14:29:40 UTC, so requests queue until they time out.",
      "Deployment pay-2026.08.26.4 lowered the per-pod connection ceiling from 240 to 60 at 14:26:00 UTC.",
    ],
    confidence: confidence(
      0.91,
      "Every hop except the final attribution is observed in traces or change records; the causal link from the configuration change to the saturation is derived from ordering plus the changed file.",
    ),
    evidenceIds: ["ev-008", "ev-011", "ev-002", "ev-033", "ev-003", "ev-005", "ev-004", "ev-013"],
  },
  {
    id: "path-search-causal",
    kind: "causal",
    label: "EU customers → Search → Search Query → eu-central router → Routing change",
    nodeIds: [
      "jny-search",
      "stp-search-query",
      "app-search",
      "svc-search-query",
      "k8s-search-euc1",
      "rtr-core-euc1",
      "if-rtr-core-euc1-et3",
      "chg-8836",
    ],
    edgeIds: [
      "jny-search--hasStep--stp-search-query",
      "stp-search-query--servedBy--app-search",
      "app-search--dependsOn--svc-search-query",
      "svc-search-query--deployedOn--k8s-search-euc1",
      "k8s-search-euc1--connectedTo--rtr-core-euc1",
      "rtr-core-euc1--connectedTo--if-rtr-core-euc1-et3",
      "if-rtr-core-euc1-et3--changedBy--chg-8836",
    ],
    narration: [
      "41,200 European customers ran a search and waited longer than the 900 ms experience threshold.",
      "The query step is served by Search & Discovery, which calls Search Query Service.",
      "Search Query Service runs entirely in the eu-central cluster, in a single availability zone.",
      "Its traffic reaches the index tier through core-rtr-euc1-01, on interface Ethernet3/1.",
      "That interface is showing 0.68% packet loss and 38.6 ms round-trip against a 1.4 ms baseline.",
      "CHG-8836 moved traffic onto this path at 10:48 UTC by lowering BGP local-preference.",
    ],
    confidence: confidence(
      0.87,
      "Path change is directly observable in traceroute measurements; the interface may also carry an underlying fault, which would make the policy an exposure rather than the sole cause.",
    ),
    evidenceIds: ["ev-027", "ev-021", "ev-041", "ev-023", "ev-022", "ev-024"],
  },
  {
    id: "path-trace-88213",
    kind: "experience",
    label: "Traced request · 4f3a91c8b27d40e6",
    nodeIds: [
      "cust-88213",
      "app-storefront-web",
      "app-checkout",
      "svc-checkout-orchestrator",
      "svc-payment-service",
      "db-payments-primary",
    ],
    edgeIds: [
      "cust-88213--engagesIn--jny-checkout",
      "app-storefront-web--dependsOn--app-checkout",
      "app-checkout--dependsOn--svc-checkout-orchestrator",
      "svc-checkout-orchestrator--dependsOn--svc-payment-service",
      "svc-payment-service--persistsTo--db-payments-primary",
    ],
    narration: [
      "The customer pressed Pay at 14:37:21 UTC in the web storefront.",
      "The request reached Checkout API and entered the authorisation flow.",
      "Checkout Orchestrator called Payment Service, which held the request for 8.2 seconds.",
      "Payment Service never reached the gateway: it timed out acquiring a database connection at 8,001 ms.",
      "The customer saw a generic failure message with no retry affordance.",
    ],
    confidence: confidence(0.98, "Every hop is a span in a single distributed trace."),
    evidenceIds: ["ev-014", "ev-006", "ev-003", "ev-049"],
  },
  {
    id: "path-payments-network",
    kind: "network",
    label: "Payment authorisation network path",
    nodeIds: [
      "svc-payment-service",
      "lb-payments-use1",
      "fw-payments-dmz",
      "rtr-core-use1",
      "sw-tor-use1-a",
      "k8s-payments-use1",
    ],
    edgeIds: [
      "svc-payment-service--routesThrough--lb-payments-use1",
      "lb-payments-use1--hostedOn--fw-payments-dmz",
      "fw-payments-dmz--connectedTo--rtr-core-use1",
      "rtr-core-use1--connectedTo--sw-tor-use1-a",
      "svc-payment-service--deployedOn--k8s-payments-use1",
    ],
    narration: [
      "Payment authorisation traffic leaves through the internal payments load balancer.",
      "It traverses the payments DMZ firewall, where no policy change has been made in 24 hours.",
      "From there it reaches the us-east core router and the top-of-rack switch, both healthy.",
      "The workload itself runs on the payments production cluster in us-east-1.",
    ],
    confidence: confidence(0.93, "Flow records cover the full path; the firewall attribution comes from Panorama."),
    evidenceIds: ["ev-035", "ev-036"],
  },
];

export const CURATED_PATHS_BY_ID = new Map(CURATED_PATHS.map((p) => [p.id, p]));
