import { JourneyDetailView } from "@/components/journeys/journey-detail-view";

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = await params;
  return <JourneyDetailView journeyId={journeyId} />;
}
