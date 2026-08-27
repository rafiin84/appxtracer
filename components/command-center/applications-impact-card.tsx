"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ApplicationImpactHeader,
  ApplicationImpactList,
  ApplicationImpactRow,
} from "@/components/applications/application-impact-row";
import { EmptyState } from "@/components/shared/states";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

/**
 * Question three: which applications are hurting the business? Ranked by value
 * at risk rather than by error rate — a noisy batch job is not a business
 * problem, and a quiet payment tier can be the whole quarter.
 */
export function ApplicationsImpactCard({
  applications,
  total,
}: {
  applications: Application[];
  total: number;
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Which applications are hurting the business?</CardTitle>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            {applications.length} of {total} applications carrying business impact
          </p>
        </div>
        <Link
          href="/applications"
          className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          aria-label="Open all applications"
        >
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 px-2 sm:px-2.5">
        {applications.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No application is degrading business outcomes"
            description="Every application is within its latency and error budgets for this window."
          />
        ) : (
          <ApplicationImpactList>
            <ApplicationImpactHeader />
            <ul>
              {applications.slice(0, 6).map((application, index) => (
                <li key={application.id}>
                  <ApplicationImpactRow application={application} rank={index + 1} />
                </li>
              ))}
            </ul>
          </ApplicationImpactList>
        )}
      </CardContent>
    </Card>
  );
}
