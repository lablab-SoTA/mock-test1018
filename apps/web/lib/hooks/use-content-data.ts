"use client";

import { useQuery } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query";
import type {
  ContentPerformanceResponse,
  ContentTopResponse,
  ContentWatchTimeResponse,
} from "@/lib/types";

export function useContentPerformance() {
  const { queryKey, queryString } = useDashboardQuery("content-performance");
  return useQuery({
    queryKey,
    queryFn: () => getJson<ContentPerformanceResponse>(`/api/content/performance?${queryString}`),
  });
}

export function useContentTop() {
  const { queryKey, queryString } = useDashboardQuery("content-top");
  return useQuery({
    queryKey,
    queryFn: () => getJson<ContentTopResponse>(`/api/content/top5?${queryString}`),
  });
}

export function useContentWatchTimeTrend() {
  const { queryKey, queryString } = useDashboardQuery("content-watch-time");
  return useQuery({
    queryKey,
    queryFn: () => getJson<ContentWatchTimeResponse>(`/api/content/watch-time-trend?${queryString}`),
  });
}
