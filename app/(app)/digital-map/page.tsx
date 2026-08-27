import { Suspense } from "react";
import type { Metadata } from "next";
import { DigitalMapView } from "@/components/graph/digital-map-view";
import { PageShell } from "@/components/app-shell/page-header";
import { LoadingCard } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Digital Map",
  description: "The evolving semantic model of your digital environment.",
};

export default function DigitalMapPage() {
  return (
    <Suspense
      fallback={
        <PageShell width="full" className="space-y-5">
          <LoadingCard lines={12} />
        </PageShell>
      }
    >
      <DigitalMapView />
    </Suspense>
  );
}
