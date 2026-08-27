import type { Metadata } from "next";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = {
  title: "Customers",
  description: "Trace an individual customer's experience end to end.",
};

export default function CustomersPage() {
  return <CustomersView />;
}
