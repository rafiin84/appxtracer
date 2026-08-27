import type { Metadata } from "next";
import { JourneysView } from "@/components/journeys/journeys-view";

export const metadata: Metadata = {
  title: "Journeys",
  description: "Critical business journeys, their health, and the business impact of each.",
};

export default function JourneysPage() {
  return <JourneysView />;
}
