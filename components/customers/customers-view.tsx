"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useCustomerSearch, useRecentCustomers } from "@/hooks/use-customer-trace";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HealthDot } from "@/components/shared/health-badge";
import { EmptyState, LoadingCard } from "@/components/shared/states";
import { SkeletonText } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/formatters";
import { useAppStore } from "@/stores/app-store";
import { SCOPES } from "@/lib/api/scopes";

const MATCH_LABEL: Record<string, string> = {
  email: "Email",
  "customer-id": "Customer ID",
  "session-id": "Session ID",
  "transaction-id": "Transaction ID",
  name: "Name",
};

/**
 * Customer lookup by any identifier an operator actually has: an email from a
 * support ticket, a customer id from a CRM, a session id from a log line, or a
 * transaction id from a chargeback.
 */
export function CustomersView() {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [submitted, setSubmitted] = React.useState("");
  const { data, isFetching } = useCustomerSearch(submitted);
  const { data: recent, isLoading: recentLoading } = useRecentCustomers();
  const scopes = useAppStore((s) => s.scopes);
  const hasPii = scopes.includes(SCOPES.pii);

  const results = data?.data ?? [];

  return (
    <PageShell className="space-y-8">
      <PageHeader
        question="What did a specific customer experience?"
        title="Customers"
        description="Trace one customer end to end: their session, the journeys they attempted, the exact request that failed, and what it cost."
      />

      <Card className="p-5 sm:p-6">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(term);
          }}
        >
          <label htmlFor="customer-search" className="sr-only">
            Search by email, customer ID, session ID or transaction ID
          </label>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-surface-sunken px-3.5 ring-hairline focus-within:ring-2 focus-within:ring-accent">
            <MagnifyingGlass className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <input
              id="customer-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="customer@company.com · cust-88213 · ses-88213-a · txn-88241093"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="shrink-0">
            Trace
            <ArrowRight />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-muted">Try</span>
          {["customer@company.com", "cust-19538", "txn-88241093"].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setTerm(example);
                setSubmitted(example);
              }}
              className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[11.5px] text-ink-secondary transition-colors hover:bg-line hover:text-ink"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-surface-sunken px-3 py-2.5">
          <ShieldCheck className="mt-px size-4 shrink-0 text-ink-muted" weight="fill" aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink-secondary text-pretty">
            {hasPii
              ? "You hold the customer identifier scope, so email addresses are shown unmasked. Every lookup is written to the audit trail."
              : "Customer identifiers are masked. Enable the customer identifier scope from your profile menu to unmask them — every unmasking is written to the audit trail."}
          </p>
        </div>
      </Card>

      {submitted && (
        <Section id="results" title="Search results" question={`Matches for “${submitted}”`}>
          {isFetching ? (
            <LoadingCard lines={4} />
          ) : results.length === 0 ? (
            <Card>
              <EmptyState
                title="No customer matched that identifier"
                description="APPX Tracer searches email addresses, customer IDs, session IDs and transaction IDs. Check the value, or try a different identifier."
              />
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 sm:pt-5">
                <ul className="divide-y divide-[var(--line)]">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link
                        href={`/customers/${result.id}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 transition-colors first:pt-0 last:pb-0 hover:text-accent"
                      >
                        <HealthDot health={result.health} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">
                            {result.displayName}
                          </span>
                          <span className="block truncate font-mono text-[11.5px] text-ink-muted">
                            {result.emailMasked} · {result.id}
                          </span>
                        </span>
                        <Badge tone="outline">{MATCH_LABEL[result.matchedOn]}</Badge>
                        <span className="text-[12px] capitalize text-ink-secondary">{result.tier}</span>
                        <span className="text-[12px] text-ink-muted">{result.region}</span>
                        <span className="text-[12px] text-ink-muted">
                          {formatRelative(result.lastSeenAt)}
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </Section>
      )}

      <Section
        id="recent"
        title="Customers currently having a bad experience"
        question="Who should I look at?"
        description="Sampled from customers whose live or most recent session scored poorly."
      >
        <Card>
          <CardHeader>
            <CardTitle>Recently degraded sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <SkeletonText lines={5} />
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {(recent?.data ?? []).map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 transition-colors first:pt-0 last:pb-0 hover:text-accent"
                      onClick={() => router.prefetch(`/customers/${customer.id}`)}
                    >
                      <HealthDot health={customer.health} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">
                          {customer.displayName}
                        </span>
                        <span className="block truncate font-mono text-[11.5px] text-ink-muted">
                          {customer.emailMasked}
                        </span>
                      </span>
                      <span className="text-[12px] capitalize text-ink-secondary">{customer.tier}</span>
                      <span className="text-[12px] text-ink-muted">{customer.region}</span>
                      <span className="text-[12px] text-ink-muted">
                        {formatRelative(customer.lastSeenAt)}
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}
