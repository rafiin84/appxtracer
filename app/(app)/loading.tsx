import { PageShell } from "@/components/app-shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingGrid } from "@/components/shared/states";

export default function AppLoading() {
  return (
    <PageShell>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <Skeleton className="mt-8 h-56 w-full rounded-panel" />
      <LoadingGrid className="mt-6" count={3} />
      <span className="sr-only" role="status">
        Loading.
      </span>
    </PageShell>
  );
}
