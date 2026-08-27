import type { Metadata } from "next";
import { ExecutiveInsightsView } from "@/components/executive/executive-view";

export const metadata: Metadata = {
  title: "Executive Insights",
  description: "Longer-term trends in digital experience, revenue impact, reliability and risk.",
};

export default function ExecutiveInsightsPage() {
  return <ExecutiveInsightsView />;
}
