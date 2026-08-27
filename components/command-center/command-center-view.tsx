"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useCommandCenter } from "@/hooks/use-dashboard";
import { PageHeader, PageShell, Section } from "@/components/app-shell/page-header";
import { CioHealthHero } from "./cio-health-hero";
import { CustomersAffectedCard } from "./customers-affected-card";
import { BreakingJourneysCard } from "./breaking-journeys-card";
import { ApplicationsImpactCard } from "./applications-impact-card";
import { GeographicImpactPanel } from "./geographic-impact";
import { BusinessTrends } from "./business-trends";
import { RootCausePanel } from "./root-cause-panel";
import { RecommendedActions } from "./recommended-actions";
import { AskEntry } from "./ask-entry";
import { IncidentImpactCard } from "@/components/incidents/incident-impact-card";
import { ChangeCorrelationCard } from "@/components/changes/change-correlation";
import { RiskCard } from "@/components/impact/risk-card";
import { ErrorState, LoadingCard, LoadingGrid, PartialDataNote } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, formatDateTime } from "@/lib/formatters";
import { COMPANY } from "@/lib/mock/company";
import { TenantChip } from "@/components/app-shell/tenant-logo";
import { Badge } from "@/components/ui/badge";

export function CommandCenterView() {
  const { data, isLoading, isError, error, refetch } = useCommandCenter();

  if (isLoading) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-64 w-full rounded-panel" />
        <LoadingGrid className="mt-6" count={3} />
        <LoadingCard className="mt-6" lines={6} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState
          description={
            error?.message ??
            "The command centre could not be assembled. No cached view is available for this window."
          }
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const payload = data.data;
  const primaryCause = payload.rootCauses[0];

  return (
    <PageShell width="wide" className="space-y-8">
      <PageHeader
        question="How is my digital business performing?"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>Command Center</span>
            <TenantChip name={COMPANY.name} />
          </span>
        }
        description={
          <>
            {COMPANY.tagline}, {formatCompactNumber(COMPANY.monthlyActiveCustomers)} monthly
            active customers across {payload.geography.length} regions.
            <span className="mt-1 block text-[13px] text-ink-muted">
              {data.meta.environment.name} · {data.meta.range.label} · generated{" "}
              {formatDateTime(data.meta.generatedAt)}
            </span>
          </>
        }
        meta={
          <>
            {data.meta.sources.slice(0, 5).map((source) => (
              <Badge key={source} tone="outline">
                {source}
              </Badge>
            ))}
            {data.meta.sources.length > 5 && (
              <Badge tone="outline">+{data.meta.sources.length - 5} more sources</Badge>
            )}
          </>
        }
      />

      <CioHealthHero payload={payload} />

      <PartialDataNote availability={data.meta.availability} />

      {/* The three questions that dominate the hierarchy. */}
      <Section
        id="three-questions"
        title="The three questions"
        question="What matters most right now"
        description="Customers, journeys, applications — in that order, because that is the order impact travels."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <CustomersAffectedCard impact={payload.impact} />
          <BreakingJourneysCard
            journeys={payload.breakingJourneys}
            total={payload.journeysTotal}
            healthy={payload.journeysHealthy}
          />
          <ApplicationsImpactCard
            applications={payload.applicationsHurtingBusiness}
            total={payload.applicationsTotal}
          />
        </div>
      </Section>

      <AskEntry />

      <Section
        id="active-issues"
        title="Active business-impacting issues"
        question="What needs my attention right now?"
        actions={
          <Link
            href="/incidents"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover"
          >
            All incidents
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {payload.activeIncidents.map((incident) => (
            <IncidentImpactCard key={incident.id} incident={incident} compact />
          ))}
        </div>
      </Section>

      <Section
        id="trends"
        title="Business and experience trends"
        question="Is digital experience getting better or worse?"
      >
        <BusinessTrends payload={payload} />
      </Section>

      <Section id="geography" title="Impact by region" question="Where is the impact happening?">
        <GeographicImpactPanel geography={payload.geography} />
      </Section>

      {primaryCause && (
        <Section
          id="why"
          title="Root cause"
          question="Why is this happening?"
          description="The strongest supported attribution, with everything it rests on."
        >
          <RootCausePanel rootCause={primaryCause} />
        </Section>
      )}

      <Section
        id="changes"
        title="What changed before things went wrong"
        question="What changed?"
        actions={
          <Link
            href="/changes"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover"
          >
            All changes
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.recentChanges
            .filter((change) => change.correlation)
            .slice(0, 2)
            .map((change) => (
              <ChangeCorrelationCard key={change.id} change={change} />
            ))}
        </div>
      </Section>

      <Section
        id="risks"
        title="Emerging risks"
        question="What could break next?"
        description="Modelled from leading indicators and structural exposures in the graph."
        actions={
          <Link
            href="/impact"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover"
          >
            Model a failure
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {payload.emergingRisks.slice(0, 3).map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </Section>

      <Section id="actions" title="Recommended actions" question="What should I do now?">
        <RecommendedActions recommendations={payload.recommendations} />
      </Section>
    </PageShell>
  );
}
