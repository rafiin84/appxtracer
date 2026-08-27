import { Suspense } from "react";
import type { Metadata } from "next";
import { AskView } from "@/components/ask/ask-view";
import { PageShell } from "@/components/app-shell/page-header";
import { LoadingCard } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Ask APPX",
  description: "Ask anything about your app and get an evidence-backed answer.",
};

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="space-y-6">
          <LoadingCard lines={6} />
        </PageShell>
      }
    >
      <AskView />
    </Suspense>
  );
}
