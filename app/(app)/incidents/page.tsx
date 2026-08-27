import type { Metadata } from "next";
import { IncidentsView } from "@/components/incidents/incidents-view";

export const metadata: Metadata = {
  title: "Incidents",
  description: "Business-impacting incidents, their cause, and what to do about them.",
};

export default function IncidentsPage() {
  return <IncidentsView />;
}
