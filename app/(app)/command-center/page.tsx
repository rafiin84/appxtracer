import type { Metadata } from "next";
import { CommandCenterView } from "@/components/command-center/command-center-view";

export const metadata: Metadata = {
  title: "Command Center",
  description:
    "How many customers are affected, which journeys are breaking, and which applications are hurting the business.",
};

export default function CommandCenterPage() {
  return <CommandCenterView />;
}
