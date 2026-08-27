"use client";

import { getCustomerTrace, getRecentCustomers, searchCustomers } from "@/lib/api";
import type { CustomerSearchResult, CustomerTracePayload } from "@/types";
import { useApiQuery } from "./use-api";

export function useCustomerSearch(term: string) {
  const enabled = term.trim().length >= 2;
  return useApiQuery<CustomerSearchResult[]>(
    ["customer-search", term.trim().toLowerCase()],
    (ctx) => searchCustomers(term, ctx),
    { enabled },
  );
}

export function useRecentCustomers() {
  return useApiQuery<CustomerSearchResult[]>(["customers-recent"], (ctx) => getRecentCustomers(ctx));
}

export function useCustomerTrace(id: string | undefined) {
  return useApiQuery<CustomerTracePayload>(
    ["customer-trace", id],
    (ctx) => getCustomerTrace(id as string, ctx),
    { enabled: Boolean(id) },
  );
}
