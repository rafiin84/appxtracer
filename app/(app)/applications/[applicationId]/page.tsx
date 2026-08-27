import { ApplicationDetailView } from "@/components/applications/application-detail-view";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <ApplicationDetailView applicationId={applicationId} />;
}
