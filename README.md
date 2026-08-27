# APPX Tracer

**Trace the Experience. Connect the Impact.**

Phase 1 frontend for APPX Tracer — an Application Experience Intelligence platform for
companies whose application *is* the business. It connects what customers experience to
the technology causing it and the business impact that follows.

This repository contains **only the React frontend**. There is no backend, database,
authentication, payment system or production business logic. Every screen is driven by a
mock API layer that returns realistic, internally consistent data.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000 → redirects to /command-center
npm run build    # production build
npm run lint
```

Node 20.19+ or 22.13+ is recommended. The app is Vercel-ready and PWA-manifested.

---

## The demo dataset

The instance models **Nike's online sales estate**: 41.6M monthly active customers, seven
regions, 12 applications, 28 services, 39 infrastructure entities, 12 business journeys,
10 incidents, 20 changes, 59 evidence records and ~440 graph relationships.

> The company is real; the data is not. Every figure, journey, incident, change and
> customer in this instance is synthetic and reflects no real systems or trading. The UI
> carries a "Demo" marker beside the tenant name, and the tenant's mark is a neutral
> placeholder rather than a reproduction of any trademarked logo. Naming a real company as
> the demo subject is the operator's decision; if you would rather it were fictional, the
> tenant lives entirely in `lib/mock/` and renaming it is a find-and-replace.

Three scenarios run through it, and every screen reads the same constants
(`lib/mock/narrative.ts`), which is what keeps the story consistent:

| Scenario | Shape |
|---|---|
| **Checkout degradation** (Sev 1, live) | A Payment Service canary lowers the per-pod DB connection ceiling from 240 to 60 → pool saturates at 97% → authorisations time out at 8.2 s → 18,420 customers affected, $4.69M modelled at risk |
| **European search latency** (Sev 2, live) | A BGP local-preference change moves EU search onto a lossy path → p95 2.9× → 41,200 customers affected |
| **Subscription renewals** (Sev 3, monitoring) | A stored-credential TTL cut to 1 hour outlives a 4-hour billing batch → 3,180 memberships fail to renew |

**The clock is fixed** at `2026-08-26T15:12:00Z` (`lib/utils/clock.ts`). Nothing calls
`Math.random()` or `Date.now()` in the mock layer, so the deployment really is eleven
minutes before the traced customer's failure — in the trace view, the incident timeline,
the change correlation panel and the Ask APPX answer, because all four read the same
constant. Replace that file and the relative formatters fall back to real time.

---

## Architecture

```
app/(app)/…            13 routes; each is a server component with metadata that
                       renders a client view from components/
components/            app-shell · command-center · journeys · applications ·
                       customers · incidents · changes · impact · graph · ask ·
                       evidence · executive · administration · shared · ui
lib/api/               the surface the UI is written against — the swap seam
lib/mock/              the Nike dataset and its deterministic telemetry
lib/graph/             layout + traversal engine (the SPARQL stand-in)
lib/ontology/          RDFS classes, OWL predicate characteristics, SHACL shapes,
                       SPARQL templates
lib/calculations/      business-impact and health maths, defined once
lib/viz/               the validated chart palette
hooks/                 TanStack Query bindings, one per domain
stores/                Zustand: app · graph · investigation
types/                 the domain contract everything is built against
```

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Radix primitives in the shadcn/ui style · Framer Motion · Phosphor Icons · Zustand ·
TanStack Query · Zod.

> The brief specified Next.js 15; 16 is the current stable release and is what
> `create-next-app` installs today. Nothing in the code depends on the difference.

---

## Replacing the mocks

Everything the UI does goes through `lib/api`. No component imports from `lib/mock`
directly except where it reads static reference data (ontology definitions, curated path
narrations). To move to production:

1. **Transport** — reimplement the functions exported from `lib/api/index.ts` against
   real endpoints. The signatures, the `ApiEnvelope<T>` shape and the domain types stay
   exactly as they are. `parseResponse` in `lib/api/schemas.ts` is the hook for runtime
   response validation.
2. **Graph** — `lib/graph/engine.ts` is the seam for a triple store. Every function there
   corresponds to a query template in `lib/ontology/sparql.ts`, and those template strings
   are the contract a real backend implements. The UI never touches the dataset directly.
3. **Clock** — delete `lib/utils/clock.ts` and let the formatters use real time.
4. **Policy** — `lib/api/scopes.ts` already models PII masking and scope checks; wire it
   to real authentication rather than adding a new layer.
5. **Validation** — `lib/ontology/shapes.ts` compiles conceptually to SHACL node shapes.
   The Administration screen runs them over the live dataset and reports real violations.

---

## Design decisions worth knowing

**Business language in primary navigation.** No "Servers", "Interfaces" or "Alarms". Those
are investigation surfaces reached from a business symptom, not destinations a CIO browses.

**Observed, derived, interpreted.** Every fact carries its provenance in the data, never
inferred at render time. Monetary figures ship with the word "Estimated" or "Observed" as
part of the value, and any modelled figure exposes its full calculation basis — method,
formula, inputs, assumptions, confidence and evidence — behind "Why this number?".
Nothing in the product may present a model output as an accounting fact.

**Deduplicated impact.** 24,780 customers affected is a union, not a sum: 18,420 checkout-
affected and 41,200 search-affected customers overlap, and the naive total would be 2.5×
too large. The UI says so where the number appears.

**Partial data is stated.** The revenue ledger runs four minutes behind the experience
feed and session replay is sampled at 2%. Both are named on every surface that would
otherwise imply completeness.

**Charts.** One validated categorical palette, assigned by entity and never by rank, so
filtering never repaints the survivors. Both light and dark steps are selected and were
validated against this product's actual surfaces (`lib/viz/palette.ts` records the
results). Every chart ships a legend for two or more series, a table view, and a text
alternative; no chart uses two y-axes.

**The graph is bounded on purpose.** The Digital Map opens focused on the most
business-critical journey at depth 2, caps the rendered node count, and offers a list view
carrying the same data. An unbounded projection of a shared database's neighbourhood is
the entire estate — beautiful for a screenshot, useless to read.

**Three views of one graph, answering different questions.** *Map* is layered by ontology
layer, so it answers how impact travels — business at the top, infrastructure at the
bottom. *Brain* is radial, with the tenant at the centre and one ring per ontology class,
so it answers what the model knows about and how much of each; category density is
interleaved around the wheel rather than ranked, or every large cluster would pack into
one arc. *List* is the same data as text. All three are deterministic: the same snapshot
always draws the same picture, so the shape becomes something a user can remember.

**Motion carries meaning.** Page transitions, causal-path reveals, number counting and
graph pulses all communicate causality or state. Everything is skipped under
`prefers-reduced-motion`.

---

## Accessibility

WCAG 2.2 AA is the target. Semantic landmarks and a skip link; keyboard-operable graph
nodes; visible focus rings on a token; status never carried by colour alone (every badge
pairs hue with an icon and a written label); a table view behind every chart; an accessible
list rendering of the graph; `role="img"` summaries on visualisations; reduced-motion
support at the stylesheet level so it also covers Framer Motion.

---

## What is deliberately not here

No backend, database, authentication, payments, real telemetry ingestion, or production
GraphRAG infrastructure. Governance actions on the Journeys screen (validate, assign an
owner) are represented and labelled as not yet wired up.
