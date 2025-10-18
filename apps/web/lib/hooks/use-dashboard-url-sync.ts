"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDashboardStore } from "@/lib/store/dashboard-store";
import { buildDashboardSearchParams } from "@/lib/utils/dashboard";
import type { DashboardFilters } from "@/lib/types";

export function useDashboardUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydrated = useRef(false);

  const state = useDashboardStore((store) => ({
    range: store.range,
    preset: store.preset,
    compare: store.compare,
    groupBy: store.groupBy,
    filters: store.filters,
    locale: store.locale,
    hydrate: store.hydrate,
  }));

  const hydrateFromSearchParams = useCallback(() => {
    if (hasHydrated.current) return;
    const params = searchParams;
    const preset = (params.get("preset") as typeof state.preset | null) ?? state.preset;
    const compareParam = params.get("compare");
    const compare = compareParam === "prev" ? "previous" : (compareParam as typeof state.compare) ?? state.compare;
    const groupBy = (params.get("groupBy") as typeof state.groupBy | null) ?? state.groupBy;
    const start = params.get("start") ?? state.range.start;
    const end = params.get("end") ?? state.range.end;
    const langParam = params.get("lang");
    const locale = langParam === "ja" ? "ja" : langParam === "en" ? "en" : state.locale;

    const filters: DashboardFilters = {
      platform: parseList(params, "platform"),
      country: parseList(params, "country"),
      device: parseList(params, "device"),
      userType: parseList(params, "userType"),
      product: parseList(params, "product") as DashboardFilters["product"],
    };

    state.hydrate({
      preset,
      compare,
      groupBy: groupBy ?? state.groupBy,
      range: { start, end },
      filters,
      locale,
    });

    hasHydrated.current = true;
  }, [searchParams, state]);

  useEffect(() => {
    hydrateFromSearchParams();
  }, [hydrateFromSearchParams]);

  useEffect(() => {
    if (!hasHydrated.current) return;

    const nextSearch = buildDashboardSearchParams(state).toString();
    if (nextSearch === searchParams.toString()) return;

    router.replace(`${pathname}?${nextSearch}`, { scroll: false });
  }, [pathname, router, searchParams, state]);

  const queryString = useMemo(() => {
    return buildDashboardSearchParams(state).toString();
  }, [state]);

  return { queryString };
}

function parseList(params: URLSearchParams, key: string) {
  const value = params.get(key);
  if (!value) return [];
  return value.split(",").filter(Boolean);
}
