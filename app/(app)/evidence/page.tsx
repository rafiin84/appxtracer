import type { Metadata } from "next";
import { EvidenceView } from "@/components/evidence/evidence-view";

export const metadata: Metadata = {
  title: "Evidence",
  description: "Every claim in APPX Tracer, and the records it rests on.",
};

export default function EvidencePage() {
  return <EvidenceView />;
}
