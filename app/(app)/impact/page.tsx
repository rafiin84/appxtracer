import { Suspense } from "react";
import type { Metadata } from "next";
import { ImpactView } from "@/components/impact/impact-view";
import { PageShell } from "@/components/app-shell/page-header";
import { LoadingCard } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Impact",
  description: "Model a failure and see the blast radius across journeys, customers and revenue.",
};

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <LoadingCard lines={10} />
        </PageShell>
      }
    >
      <ImpactView />
    </Suspense>
  );
}
