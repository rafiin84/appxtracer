import type { Metadata } from "next";
import { ApplicationsView } from "@/components/applications/applications-view";

export const metadata: Metadata = {
  title: "Applications",
  description: "Which applications are affecting the business, and by how much.",
};

export default function ApplicationsPage() {
  return <ApplicationsView />;
}
