import type { Metadata } from "next";
import { ChangesView } from "@/components/changes/changes-view";

export const metadata: Metadata = {
  title: "Changes",
  description: "What changed before an incident or a degradation, and how strongly it correlates.",
};

export default function ChangesPage() {
  return <ChangesView />;
}
