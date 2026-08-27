"use client";

import * as React from "react";
import type { GraphSnapshot } from "@/types";
import { classLabel, LAYER_LABEL, LAYER_ORDER } from "@/lib/ontology/classes";
import { predicateLabel } from "@/lib/ontology/predicates";
import { Card } from "@/components/ui/card";
import { HealthDot } from "@/components/shared/health-badge";
import { cn } from "@/lib/utils/cn";

/**
 * The accessible alternative to the map, and a genuinely faster way to read the
 * graph when you already know what you are looking for. Same data, same
 * selection model, grouped by ontology layer.
 */
export function GraphListView({
  snapshot,
  onSelect,
  selectedId,
}: {
  snapshot: GraphSnapshot;
  onSelect?: (id: string) => void;
  selectedId?: string;
}) {
  const grouped = React.useMemo(() => {
    const outgoing = new Map<string, typeof snapshot.edges>();
    for (const edge of snapshot.edges) {
      (outgoing.get(edge.from) ?? outgoing.set(edge.from, []).get(edge.from)!).push(edge);
    }
    return LAYER_ORDER.map((layer) => ({
      layer,
      nodes: snapshot.nodes
        .filter((n) => n.layer === layer)
        .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label)),
      outgoing,
    })).filter((group) => group.nodes.length > 0);
  }, [snapshot]);

  const labelById = React.useMemo(
    () => new Map(snapshot.nodes.map((n) => [n.id, n.label])),
    [snapshot],
  );

  return (
    <Card className="p-4 sm:p-5">
      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.layer} aria-labelledby={`layer-${group.layer}`}>
            <h3
              id={`layer-${group.layer}`}
              className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted"
            >
              {LAYER_LABEL[group.layer]} · {group.nodes.length}
            </h3>
            <ul className="mt-2 divide-y divide-[var(--line)]">
              {group.nodes.map((node) => {
                const edges = group.outgoing.get(node.id) ?? [];
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(node.id)}
                      className={cn(
                        "w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-sunken",
                        selectedId === node.id && "bg-surface-sunken ring-1 ring-accent",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <HealthDot health={node.health} />
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                          {node.label}
                        </span>
                        <span className="shrink-0 text-[11.5px] text-ink-muted">
                          {classLabel(node.kind)}
                        </span>
                      </span>
                      {edges.length > 0 && (
                        <span className="mt-1 block truncate pl-[1.375rem] text-[11.5px] text-ink-muted">
                          {edges
                            .slice(0, 3)
                            .map(
                              (edge) =>
                                `${predicateLabel(edge.predicate)} ${labelById.get(edge.to) ?? edge.to}`,
                            )
                            .join(" · ")}
                          {edges.length > 3 ? ` · +${edges.length - 3} more` : ""}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}
