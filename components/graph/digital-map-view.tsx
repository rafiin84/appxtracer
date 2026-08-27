"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Graph, ListBullets, X } from "@phosphor-icons/react/dist/ssr";
import type { GraphLayer, GraphNodeKind, HealthState } from "@/types";
import { useGraph } from "@/hooks/use-graph";
import { useGraphStore } from "@/stores/graph-store";
import { PageHeader, PageShell } from "@/components/app-shell/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { BrainDiagram } from "./brain-diagram";
import { BrainLegend } from "./brain-legend";
import { DependencyGraph } from "./dependency-graph";
import { GraphInspector } from "./graph-inspector";
import { GraphListView } from "./graph-list-view";
import { ErrorState, LoadingCard } from "@/components/shared/states";
import { HealthDot } from "@/components/shared/health-badge";
import { CURATED_PATHS } from "@/lib/mock/paths";
import { categorySummary } from "@/lib/graph/brain-layout";
import { LAYER_LABEL, LAYER_ORDER, classPlural } from "@/lib/ontology/classes";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";

const FILTERABLE_KINDS: GraphNodeKind[] = [
  "journey",
  "application",
  "api",
  "service",
  "database",
  "queue",
  "cache",
  "cdn",
  "third-party",
  "kubernetes-cluster",
  "container",
  "vm",
  "cloud-resource",
  "network-device",
  "firewall",
  "security-control",
  "change",
  "incident",
  "customer",
];

const HEALTH_OPTIONS: HealthState[] = ["critical", "impaired", "degraded", "healthy"];

/** The map opens here: the journey carrying the most business impact. */
const DEFAULT_FOCUS_ID = "jny-checkout";

/** Stable object identity — the graph query memoises on it. */
const BRAIN_OVERRIDES = { focusId: undefined, depth: undefined } as const;

/**
 * The digital map.
 *
 * The default view is the whole estate, layered. Everything else is a way of
 * cutting it down: focus a node, filter to impacted entities, or highlight a
 * known causal path. The list view is a first-class alternative rather than a
 * fallback — it carries the same data and is often faster to read.
 */
export function DigitalMapView() {
  const params = useSearchParams();
  const store = useGraphStore();
  const brainMode = store.viewMode === "brain";
  // The brain is a whole-estate overview: focusing would defeat its purpose,
  // so it deliberately reads the unfocused projection. Filters still apply.
  const { data, isLoading, isError, error, refetch } = useGraph(
    brainMode ? BRAIN_OVERRIDES : undefined,
  );

  const initialised = React.useRef(false);

  React.useEffect(() => {
    const focus = params.get("focus");
    const path = params.get("path");
    if (focus) store.setFocus(focus, 2);
    if (path) store.highlightPath(path);

    // The whole estate at once is a hairball at any real scale, so the map
    // opens focused on the most business-critical journey. "Show whole estate"
    // is one click away and is the right tool for a different job.
    if (!focus && !initialised.current && !store.focusId) {
      store.setFocus(DEFAULT_FOCUS_ID, 2);
    }
    initialised.current = true;
    // Only on mount / param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const snapshot = data?.data.snapshot;
  const nodesById = React.useMemo(
    () => new Map((snapshot?.nodes ?? []).map((n) => [n.id, n])),
    [snapshot],
  );
  const selectedNode = store.selectedNodeId ? nodesById.get(store.selectedNodeId) : undefined;
  const selectedEdge = store.selectedEdgeId
    ? snapshot?.edges.find((e) => e.id === store.selectedEdgeId)
    : undefined;
  const highlightedPath = CURATED_PATHS.find((p) => p.id === store.highlightedPathId);
  const categories = React.useMemo(
    () => (snapshot ? categorySummary(snapshot) : []),
    [snapshot],
  );

  const activeFilters =
    store.kinds.length + store.layers.length + store.health.length + (store.impactedOnly ? 1 : 0);

  return (
    <PageShell width="full" className="space-y-5">
      <PageHeader
        question="What is connected to what?"
        title="Digital Map"
        description="An evolving semantic model of the estate: customers, journeys, applications, services, data, infrastructure, network, security, changes and incidents — and every relationship between them."
        actions={
          <Segmented<"graph" | "brain" | "list">
            label="View mode"
            value={store.viewMode}
            onChange={store.setViewMode}
            options={[
              { value: "graph", label: "Map", hint: "Layered by ontology layer — how impact travels" },
              { value: "brain", label: "Brain", hint: "Radial overview of everything the model knows" },
              { value: "list", label: "List", hint: "The same data as text" },
            ]}
          />
        }
      />

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label htmlFor="graph-search" className="sr-only">
              Search the graph
            </label>
            <Input
              id="graph-search"
              value={store.search}
              onChange={(event) => store.setSearch(event.target.value)}
              placeholder="Search entities"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <Switch
                checked={store.impactedOnly}
                onCheckedChange={store.setImpactedOnly}
                aria-label="Show only impacted entities"
              />
              Impacted only
            </label>

            {brainMode ? (
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <Switch
                  checked={store.showRelationships}
                  onCheckedChange={store.setShowRelationships}
                  aria-label="Overlay relationships on the brain diagram"
                />
                Show relationships
              </label>
            ) : (
              <Segmented
                label="Traversal depth"
                size="sm"
                value={String(store.depth)}
                onChange={(value) => store.setDepth(Number(value))}
                options={[
                  { value: "1", label: "1 hop" },
                  { value: "2", label: "2 hops" },
                  { value: "3", label: "3 hops" },
                ]}
              />
            )}

            {brainMode ? null : store.focusId ? (
              <Button variant="secondary" size="sm" onClick={() => store.setFocus(undefined)}>
                Show whole estate
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => store.setFocus(DEFAULT_FOCUS_ID, 2)}>
                Focus Complete Checkout
              </Button>
            )}

            {(activeFilters > 0 ||
              store.highlightedPathId ||
              store.highlightedCategory ||
              (!brainMode && store.focusId)) && (
              <Button variant="ghost" size="sm" onClick={store.reset}>
                <X />
                Clear (
                {activeFilters +
                  (store.highlightedCategory ? 1 : 0) +
                  (!brainMode && store.focusId ? 1 : 0)}
                )
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 hairline-t pt-3">
          <FilterRow label="Layer">
            {LAYER_ORDER.map((layer) => (
              <FilterChip
                key={layer}
                active={store.layers.includes(layer)}
                onClick={() =>
                  store.setLayers(
                    store.layers.includes(layer)
                      ? store.layers.filter((l) => l !== layer)
                      : [...store.layers, layer as GraphLayer],
                  )
                }
              >
                {LAYER_LABEL[layer]}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Health">
            {HEALTH_OPTIONS.map((health) => (
              <FilterChip
                key={health}
                active={store.health.includes(health)}
                onClick={() =>
                  store.setHealth(
                    store.health.includes(health)
                      ? store.health.filter((h) => h !== health)
                      : [...store.health, health],
                  )
                }
              >
                <HealthDot health={health} />
                <span className="capitalize">{health}</span>
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Entity type">
            {FILTERABLE_KINDS.map((kind) => (
              <FilterChip
                key={kind}
                active={store.kinds.includes(kind)}
                onClick={() =>
                  store.setKinds(
                    store.kinds.includes(kind)
                      ? store.kinds.filter((k) => k !== kind)
                      : [...store.kinds, kind],
                  )
                }
              >
                {classPlural(kind)}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Highlight path">
            {CURATED_PATHS.map((path) => (
              <FilterChip
                key={path.id}
                active={store.highlightedPathId === path.id}
                onClick={() =>
                  store.highlightPath(store.highlightedPathId === path.id ? undefined : path.id)
                }
              >
                {path.label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </Card>

      {isLoading && <LoadingCard lines={12} />}

      {isError && (
        <Card>
          <ErrorState
            description={error?.message ?? "The graph could not be projected for this window."}
            onRetry={() => refetch()}
          />
        </Card>
      )}

      {snapshot && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-secondary">
              <Badge tone="outline">
                {formatNumber(snapshot.nodes.length)} of {formatNumber(snapshot.totals.nodes)} entities
              </Badge>
              <Badge tone="outline">
                {formatNumber(snapshot.edges.length)} relationships
              </Badge>
              {data?.data.truncated && (
                <Badge tone="warning">
                  Capped for legibility — heaviest and least healthy entities kept
                </Badge>
              )}
              {brainMode ? (
                <Badge tone="outline">Whole estate · {categories.length} categories</Badge>
              ) : store.focusId ? (
                <Badge tone="accent">
                  Focused on {nodesById.get(store.focusId)?.label ?? store.focusId} · {store.depth}{" "}
                  {store.depth === 1 ? "hop" : "hops"}
                </Badge>
              ) : (
                <span className="text-ink-muted">
                  Showing the whole estate. Focus an entity, or switch to List, for a readable view.
                </span>
              )}
            </div>

            {store.viewMode === "brain" ? (
              <BrainDiagram
                snapshot={snapshot}
                highlightedPath={highlightedPath}
                selectedId={store.selectedNodeId}
                highlightedCategory={store.highlightedCategory}
                showRelationships={store.showRelationships}
                onSelectNode={store.selectNode}
                onSelectCategory={(kind) =>
                  store.highlightCategory(store.highlightedCategory === kind ? undefined : kind)
                }
                height={680}
              />
            ) : store.viewMode === "graph" ? (
              <DependencyGraph
                snapshot={snapshot}
                highlightedPath={highlightedPath}
                selectedId={store.selectedNodeId}
                onSelectNode={store.selectNode}
                onSelectEdge={store.selectEdge}
                height={620}
              />
            ) : (
              <GraphListView
                snapshot={snapshot}
                onSelect={store.selectNode}
                selectedId={store.selectedNodeId}
              />
            )}

            {highlightedPath && (
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{highlightedPath.label}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => store.highlightPath(undefined)}>
                    <X />
                    Clear path
                  </Button>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {highlightedPath.narration.map((line, index) => (
                    <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-secondary">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-critical-soft text-[11px] font-semibold tabular text-critical-ink">
                        {index + 1}
                      </span>
                      <span className="text-pretty">{line}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <Card className="p-4">
              <CardTitle className="text-[13px]">How this was queried</CardTitle>
              <p className="mt-1.5 text-[12.5px] text-ink-secondary text-pretty">
                {data?.data.query.description}
              </p>
              <pre
                className="mt-2.5 overflow-x-auto rounded-lg bg-surface-sunken px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-secondary"
                data-slot="scroll-thin"
              >
                {data?.data.query.text}
              </pre>
            </Card>
          </div>

          <div className="min-w-0 space-y-4">
            {brainMode && (
              <BrainLegend
                className="max-h-[30rem]"
                categories={categories}
                totals={{ entities: snapshot.nodes.length, relationships: snapshot.edges.length }}
                highlighted={store.highlightedCategory}
                onHighlight={store.highlightCategory}
              />
            )}
            <GraphInspector
              node={selectedNode}
              edge={selectedEdge}
              edges={snapshot.edges}
              nodesById={nodesById}
              onFocus={(id) => {
                store.setViewMode("graph");
                store.setFocus(id, store.depth);
              }}
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-accent text-on-accent"
          : "bg-surface-sunken text-ink-secondary hover:bg-line hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export { Graph as GraphIcon, ListBullets };
