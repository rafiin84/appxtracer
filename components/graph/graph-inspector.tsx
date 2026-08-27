"use client";

import Link from "next/link";
import { ArrowRight, ArrowsOutSimple } from "@phosphor-icons/react/dist/ssr";
import type { GraphEdge, GraphNode } from "@/types";
import { classLabel, LAYER_LABEL } from "@/lib/ontology/classes";
import { PREDICATE_BY_NAME } from "@/lib/ontology/predicates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/shared/health-badge";
import { ProvenanceBadge } from "@/components/shared/provenance";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { EmptyState } from "@/components/shared/states";
import { formatDateTime } from "@/lib/formatters";

/**
 * The inspector for whatever is selected on the map. Selecting an edge is a
 * first-class action, because the relationship is often the interesting thing:
 * who asserted it, when, and on what evidence.
 */
export function GraphInspector({
  node,
  edge,
  edges,
  nodesById,
  onFocus,
}: {
  node?: GraphNode;
  edge?: GraphEdge;
  edges: GraphEdge[];
  nodesById: Map<string, GraphNode>;
  onFocus?: (id: string) => void;
}) {
  if (edge) {
    const definition = PREDICATE_BY_NAME.get(edge.predicate);
    const from = nodesById.get(edge.from);
    const to = nodesById.get(edge.to);
    return (
      <Card className="min-w-0">
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Relationship</CardTitle>
            <p className="mt-0.5 font-mono text-[11.5px] text-ink-muted">{definition?.curie}</p>
          </div>
          <ProvenanceBadge provenance={edge.provenance} />
        </CardHeader>
        <CardContent>
          <p className="rounded-lg bg-surface-sunken px-3 py-2.5 text-[13px] leading-relaxed text-ink">
            <span className="font-semibold">{from?.label ?? edge.from}</span>{" "}
            <span className="text-accent-ink">{definition?.label ?? edge.predicate}</span>{" "}
            <span className="font-semibold">{to?.label ?? edge.to}</span>
          </p>
          {definition && (
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-secondary text-pretty">
              {definition.description}
            </p>
          )}

          <dl className="mt-4 space-y-2 text-[12.5px]">
            {definition && (
              <>
                <Row label="Inverse reading">
                  {to?.label ?? edge.to} {definition.inverseLabel} {from?.label ?? edge.from}
                </Row>
                <Row label="Transitive">{definition.transitive ? "Yes" : "No"}</Row>
                <Row label="Symmetric">{definition.symmetric ? "Yes" : "No"}</Row>
              </>
            )}
            {edge.source && <Row label="Asserted by">{edge.source}</Row>}
            {edge.assertedAt && <Row label="Asserted at">{formatDateTime(edge.assertedAt)}</Row>}
          </dl>

          {edge.confidence && (
            <div className="mt-3">
              <ConfidenceBadge confidence={edge.confidence} />
            </div>
          )}
          {edge.evidenceIds && edge.evidenceIds.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                Evidence
              </p>
              <div className="mt-1.5">
                <EvidenceHandles ids={edge.evidenceIds} title="Relationship evidence" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!node) {
    return (
      <Card className="min-w-0">
        <EmptyState
          icon={ArrowsOutSimple}
          title="Nothing selected"
          description="Select a node or a relationship on the map to inspect it. Focusing a node narrows the map to its neighbourhood."
        />
      </Card>
    );
  }

  const outgoing = edges.filter((e) => e.from === node.id);
  const incoming = edges.filter((e) => e.to === node.id);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{node.label}</CardTitle>
          <p className="mt-0.5 text-[12px] text-ink-secondary">
            {classLabel(node.kind)} · {LAYER_LABEL[node.layer]}
          </p>
        </div>
        <HealthBadge health={node.health} />
      </CardHeader>

      <CardContent>
        {node.facts.length > 0 && (
          <dl className="space-y-2 text-[12.5px]">
            {node.facts.map((fact) => (
              <Row key={fact.label} label={fact.label}>
                {fact.value}
              </Row>
            ))}
          </dl>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {onFocus && (
            <Button variant="secondary" size="sm" onClick={() => onFocus(node.id)}>
              Focus neighbourhood
            </Button>
          )}
          {node.href && (
            <Button asChild variant="ghost" size="sm">
              <Link href={node.href}>
                Open
                <ArrowRight />
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/impact?origin=${node.id}`}>If this fails, what breaks?</Link>
          </Button>
        </div>

        <RelationshipList
          title={`Depends on · ${outgoing.length}`}
          edges={outgoing}
          nodesById={nodesById}
          direction="out"
          onFocus={onFocus}
        />
        <RelationshipList
          title={`Supports · ${incoming.length}`}
          edges={incoming}
          nodesById={nodesById}
          direction="in"
          onFocus={onFocus}
        />

        {node.evidenceIds && node.evidenceIds.length > 0 && (
          <div className="mt-4 hairline-t pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              Evidence
            </p>
            <div className="mt-1.5">
              <EvidenceHandles ids={node.evidenceIds.slice(0, 8)} title={node.label} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

function RelationshipList({
  title,
  edges,
  nodesById,
  direction,
  onFocus,
}: {
  title: string;
  edges: GraphEdge[];
  nodesById: Map<string, GraphNode>;
  direction: "in" | "out";
  onFocus?: (id: string) => void;
}) {
  if (!edges.length) return null;
  return (
    <div className="mt-4 hairline-t pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {edges.slice(0, 8).map((edge) => {
          const otherId = direction === "out" ? edge.to : edge.from;
          const other = nodesById.get(otherId);
          return (
            <li key={edge.id}>
              <button
                type="button"
                onClick={() => onFocus?.(otherId)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] transition-colors hover:bg-surface-sunken"
              >
                <Badge tone="outline">{edge.label}</Badge>
                <span className="min-w-0 flex-1 truncate text-ink">{other?.label ?? otherId}</span>
              </button>
            </li>
          );
        })}
        {edges.length > 8 && (
          <li className="px-1.5 text-[11.5px] text-ink-muted">
            +{edges.length - 8} more not listed
          </li>
        )}
      </ul>
    </div>
  );
}
