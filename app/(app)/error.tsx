"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/states";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where the error would reach the observability
    // estate — the same estate the product reads from.
    console.error("APPX Tracer view error", error);
  }, [error]);

  return (
    <PageShell>
      <Card>
        <ErrorState
          title="This view could not be rendered"
          description={
            error.message ||
            "Something failed while assembling this screen. The rest of the product is unaffected — every other view loads independently."
          }
          onRetry={reset}
        />
      </Card>
    </PageShell>
  );
}
