"use client";

import { useMemo } from "react";
import { shallow } from "zustand/shallow";

import { useDashboardStore } from "@/lib/store/dashboard-store";
import { buildDashboardSearchParams } from "@/lib/utils/dashboard";

export function useDashboardQuery(scope: string) {
  const state = useDashboardStore(
    (store) => ({
      range: store.range,
      preset: store.preset,
      compare: store.compare,
      groupBy: store.groupBy,
      filters: store.filters,
      locale: store.locale,
    }),
    shallow,
  );

  const queryString = useMemo(() => buildDashboardSearchParams(state).toString(), [state]);
  const queryKey = useMemo(() => [scope, queryString], [scope, queryString]);

  return {
    state,
    queryKey,
    queryString,
  };
}
