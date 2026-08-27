import type { Metadata } from "next";
import { AdministrationView } from "@/components/administration/administration-view";

export const metadata: Metadata = {
  title: "Administration",
  description: "Connected sources, model quality, ontology and access governance.",
};

export default function AdministrationPage() {
  return <AdministrationView />;
}
