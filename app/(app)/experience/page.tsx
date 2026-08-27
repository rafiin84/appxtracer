import type { Metadata } from "next";
import { ExperienceView } from "@/components/experience/experience-view";

export const metadata: Metadata = {
  title: "Experience",
  description: "Application and customer experience across the digital estate.",
};

export default function ExperiencePage() {
  return <ExperienceView />;
}
