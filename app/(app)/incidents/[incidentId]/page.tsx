import { IncidentDetailView } from "@/components/incidents/incident-detail-view";

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const { incidentId } = await params;
  return <IncidentDetailView incidentId={incidentId} />;
}
