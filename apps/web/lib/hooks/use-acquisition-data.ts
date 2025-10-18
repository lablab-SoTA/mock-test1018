"use client";

import { useQuery } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query";
import type {
  AcquisitionFunnelResponse,
  AcquisitionMixResponse,
  AcquisitionPlatformArpuResponse,
  AcquisitionSourcesResponse,
} from "@/lib/types";

export function useAcquisitionFunnel() {
  const { queryKey, queryString } = useDashboardQuery("acquisition-funnel");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AcquisitionFunnelResponse>(`/api/acquisition/funnel?${queryString}`),
  });
}

export function useAcquisitionSources() {
  const { queryKey, queryString } = useDashboardQuery("acquisition-sources");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AcquisitionSourcesResponse>(`/api/acquisition/sources?${queryString}`),
  });
}

export function useAcquisitionPlatformArpu() {
  const { queryKey, queryString } = useDashboardQuery("acquisition-platform-arpu");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AcquisitionPlatformArpuResponse>(`/api/acquisition/platform-arpu?${queryString}`),
  });
}

export function useAcquisitionMix() {
  const { queryKey, queryString } = useDashboardQuery("acquisition-mix");
  return useQuery({
    queryKey,
    queryFn: () => getJson<AcquisitionMixResponse>(`/api/acquisition/mix?${queryString}`),
  });
}
