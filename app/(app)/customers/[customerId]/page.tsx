import { CustomerTraceView } from "@/components/customers/customer-trace-view";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerTraceView customerId={customerId} />;
}
