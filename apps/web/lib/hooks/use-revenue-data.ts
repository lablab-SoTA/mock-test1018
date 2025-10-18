"use client";

import { useQuery } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query";
import type {
  RevenueBreakdownResponse,
  RevenueSummaryResponse,
  RevenueTransactionsResponse,
} from "@/lib/types";

export function useRevenueSummary() {
  const { queryKey, queryString } = useDashboardQuery("revenue-summary");
  return useQuery({
    queryKey,
    queryFn: () => getJson<RevenueSummaryResponse>(`/api/revenue/summary?${queryString}`),
  });
}

export function useRevenueBreakdown() {
  const { queryKey, queryString } = useDashboardQuery("revenue-breakdown");
  return useQuery({
    queryKey,
    queryFn: () => getJson<RevenueBreakdownResponse>(`/api/revenue/breakdown?${queryString}`),
  });
}

export function useRevenueTransactions() {
  const { queryKey, queryString } = useDashboardQuery("revenue-transactions");
  return useQuery({
    queryKey,
    queryFn: () => getJson<RevenueTransactionsResponse>(`/api/revenue/transactions?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}
