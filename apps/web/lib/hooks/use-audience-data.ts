"use client";

import { useQuery } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query";
import type {
  AudienceFollowersResponse,
  AudienceRealtimeResponse,
  AudienceRetentionResponse,
} from "@/lib/types";

export function useAudienceFollowers() {
  const { queryKey, queryString } = useDashboardQuery("audience-followers");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AudienceFollowersResponse>(`/api/audience/followers?${queryString}`),
  });
}

export function useAudienceRetention() {
  const { queryKey, queryString } = useDashboardQuery("audience-retention");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AudienceRetentionResponse>(`/api/audience/retention?${queryString}`),
  });
}

export function useAudienceRealtime() {
  const { queryKey, queryString } = useDashboardQuery("audience-realtime");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AudienceRealtimeResponse>(`/api/audience/realtime?${queryString}`),
    refetchInterval: 60_000,
  });
}
