"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useCustomerTrace } from "@/hooks/use-customer-trace";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/shared/health-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueImpact } from "@/components/shared/revenue-impact";
import { EvidenceHandles } from "@/components/shared/evidence-handle";
import { CausalPath } from "@/components/shared/causal-path";
import { usePathNodes } from "@/components/shared/use-path-nodes";
import { TraceTimeline } from "./trace-timeline";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { ErrorState, LoadingCard, PartialDataNote } from "@/components/shared/states";
import {
  formatDate,
  formatDateTime,
  formatDurationMs,
  formatMoneyExact,
  formatRelative,
} from "@/lib/formatters";

const TXN_TONE = {
  completed: "good",
  failed: "critical",
  abandoned: "serious",
  pending: "warning",
  reversed: "warning",
} as const;

/**
 * The customer trace.
 *
 * Every sentence of the narrative carries the evidence behind it, so the story
 * a CIO would tell a board and the record an engineer would debug from are the
 * same artefact.
 */
export function CustomerTraceView({ customerId }: { customerId: string }) {
  const { data, isLoading, isError, error, refetch } = useCustomerTrace(customerId);
  const pathNodes = usePathNodes(data?.data.path);

  if (isLoading) {
    return (
      <PageShell>
        <LoadingCard lines={10} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState
          title="Customer not found"
          description={error?.message ?? `No customer matches "${customerId}".`}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const trace = data.data;
  const { customer, currentSession, interactions, transactions, narrative, impact, evidence } = trace;
  const failedTransactions = transactions.filter((t) => t.status !== "completed");

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        back={{ href: "/customers", label: "Customer search" }}
        question="What did this customer experience?"
        title={customer.displayName}
        description={`A ${customer.segment} customer on the ${customer.tier} tier, in ${customer.city}. A customer since ${formatDate(customer.joinedAt)}.`}
        meta={
          <>
            <HealthBadge health={customer.currentHealth} size="md" />
            <span className="font-mono text-[12px] text-ink-muted">{customer.emailMasked}</span>
            <span className="font-mono text-[12px] text-ink-muted">{customer.id}</span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-secondary">
              <MapPin className="size-3.5 text-ink-muted" aria-hidden />
              {customer.city} · {customer.region}
            </span>
          </>
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/ask?q=Trace%20customer%40company.com">
              Ask APPX to explain this
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Session experience score"
            value={currentSession?.experienceScore ?? customer.experienceScore}
            unit="of 100"
            emphasis="critical"
            footnote={currentSession ? `Session ${currentSession.id}` : undefined}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Failed or abandoned transactions"
            value={failedTransactions.length}
            footnote={`of ${transactions.length} in the window`}
            emphasis={failedTransactions.length > 0 ? "critical" : "default"}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <RevenueImpact
            label="Unresolved basket value"
            money={impact.estimatedValueAtRisk}
            basis={impact.basis}
            size="lg"
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <StatTile
            label="Lifetime value"
            value={formatMoneyExact(customer.lifetimeValue)}
            footnote="Observed, from the revenue ledger"
          />
        </Card>
      </div>

      <PartialDataNote availability={impact.availability} />

      <Section
        id="narrative"
        title="What happened"
        question="Explain this in plain language"
        description="Every statement links to the record that supports it."
      >
        <Card className="p-5 sm:p-6">
          <ol className="space-y-3.5">
            {narrative.map((line, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-surface-sunken text-[11px] font-semibold tabular text-ink-secondary">
                  {index + 1}
                </span>
                <p className="min-w-0 text-[14px] leading-relaxed text-ink text-pretty">
                  {line.text}{" "}
                  {line.evidenceIds.length > 0 && (
                    <EvidenceHandles ids={line.evidenceIds} title="Customer trace evidence" />
                  )}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Section id="timeline" title="Experience timeline" question="What did they do, and when?">
          <Card className="p-4 sm:p-6">
            {interactions.length > 0 ? (
              <TraceTimeline
                interactions={interactions}
                failureInteractionId={trace.failurePoint?.interactionId}
              />
            ) : (
              <p className="text-[13px] text-ink-secondary">
                No interactions were captured for this customer in the selected window.
              </p>
            )}
          </Card>
        </Section>

        <div className="space-y-4">
          {trace.failurePoint && (
            <Card className="min-w-0">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>Failure point</CardTitle>
                  <p className="mt-1 text-[12.5px] text-ink-secondary">
                    {formatDateTime(trace.failurePoint.at)}
                  </p>
                </div>
                <Badge tone="critical">Terminal</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-[13.5px] leading-relaxed text-ink text-pretty">
                  {trace.failurePoint.summary}
                </p>
                <dl className="mt-3 space-y-1.5 text-[12.5px]">
                  {[
                    ["Journey", trace.failurePoint.journeyId, `/journeys/${trace.failurePoint.journeyId}`],
                    ["Step", trace.failurePoint.journeyStepId, undefined],
                    [
                      "Application",
                      trace.failurePoint.applicationId,
                      `/applications/${trace.failurePoint.applicationId}`,
                    ],
                  ].map(([label, value, href]) => (
                    <div key={label as string} className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="min-w-0 truncate font-medium text-ink">
                        {href ? (
                          <Link href={href as string} className="hover:text-accent">
                            {value}
                          </Link>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {trace.path && pathNodes.length > 0 && (
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Request path</CardTitle>
              </CardHeader>
              <CardContent>
                <CausalPath path={trace.path} nodes={pathNodes} title="Where the request went" />
              </CardContent>
            </Card>
          )}

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-[var(--line)]">
                {trace.sessions.map((session) => (
                  <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11.5px] text-ink-muted">{session.id}</span>
                      <Badge tone={session.outcome === "completed" ? "good" : session.outcome === "active" ? "accent" : "critical"}>
                        {session.outcome}
                      </Badge>
                      <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-ink-muted">
                        <Clock className="size-3.5" aria-hidden />
                        {formatRelative(session.startedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-secondary">
                      {session.device} · {session.appVersion} · {session.city} ·{" "}
                      {formatDurationMs(session.durationMs)} · score {session.experienceScore}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">{session.network}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Section id="transactions" title="Transactions" question="What did they try to buy?">
        <Card>
          <CardContent className="pt-4 sm:pt-5">
            <div className="overflow-x-auto" data-slot="scroll-thin">
              <table className="w-full min-w-[38rem] border-collapse text-[12.5px]">
                <caption className="sr-only">Transactions for {customer.displayName}</caption>
                <thead>
                  <tr>
                    {["Transaction", "Journey", "Status", "Value", "Duration", "Started"].map((c, i) => (
                      <th
                        key={c}
                        scope="col"
                        className={`hairline-b px-2 py-2 font-medium text-ink-muted ${i === 0 ? "text-left" : i > 2 ? "text-right" : "text-left"}`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <th scope="row" className="px-2 py-2.5 text-left font-mono text-[11.5px] font-normal text-ink">
                        {txn.id}
                      </th>
                      <td className="px-2 py-2.5 text-ink-secondary">
                        <Link href={`/journeys/${txn.journeyId}`} className="hover:text-accent">
                          {txn.journeyId}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge tone={TXN_TONE[txn.status]}>{txn.status}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular font-medium text-ink">
                        {formatMoneyExact(txn.value)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular text-ink-secondary">
                        {formatDurationMs(txn.durationMs)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular text-ink-muted">
                        {formatDateTime(txn.startedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {failedTransactions.some((t) => t.failureReason) && (
              <ul className="mt-4 space-y-1.5">
                {failedTransactions
                  .filter((t) => t.failureReason)
                  .map((t) => (
                    <li key={t.id} className="text-[12.5px] text-ink-secondary">
                      <span className="font-mono text-ink-muted">{t.id}</span> — {t.failureReason}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section id="evidence" title="Evidence" question="What is this trace built on?">
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {evidence.map((record) => (
            <EvidenceCard key={record.id} evidence={record} />
          ))}
        </div>
      </Section>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-px size-4 shrink-0 text-ink-muted" weight="fill" aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink-secondary text-pretty">
            This trace was assembled from session, trace and transaction records. Personally
            identifying fields are masked unless the viewer holds the customer identifier scope, and
            this lookup has been written to the audit trail with the viewer, the identifier used and
            the time.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
