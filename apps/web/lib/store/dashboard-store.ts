"use client";

import { createWithEqualityFn } from "zustand/traditional";

import { getPresetRange } from "@/lib/utils/date";
import type {
  CompareMode,
  DashboardFilters,
  DateRange,
  DateRangePreset,
  GroupByGranularity,
  Locale,
} from "@/lib/types";

type DashboardStoreState = {
  range: DateRange;
  preset: DateRangePreset;
  compare: CompareMode;
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  locale: Locale;
  setRange: (range: DateRange) => void;
  setPreset: (preset: DateRangePreset) => void;
  setCompare: (compare: CompareMode) => void;
  setGroupBy: (groupBy: GroupByGranularity) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setLocale: (locale: Locale) => void;
  hydrate: (state: Partial<
    Omit<
      DashboardStoreState,
      "hydrate" | "setRange" | "setPreset" | "setCompare" | "setGroupBy" | "setFilters" | "resetFilters" | "setLocale"
    >
  > & { filters?: DashboardFilters }) => void;
};

const defaultRange = getPresetRange("last7");

export const useDashboardStore = createWithEqualityFn<DashboardStoreState>()((set) => ({
  range: defaultRange.range,
  preset: "last7",
  compare: "none",
  groupBy: "day",
  filters: {
    platform: [],
    country: [],
    device: [],
    userType: [],
    product: [],
  },
  locale: "en",
  setRange: (range) => set({ range }),
  setPreset: (preset) =>
    set((state) => ({
      preset,
      range: preset === "custom" ? state.range : getPresetRange(preset).range,
    })),
  setCompare: (compare) => set({ compare }),
  setGroupBy: (groupBy) => set({ groupBy }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  setLocale: (locale) => set({ locale }),
  resetFilters: () =>
    set({
      filters: {
        platform: [],
        country: [],
        device: [],
        userType: [],
        product: [],
      },
    }),
  hydrate: (incoming) =>
    set((state) => ({
      ...state,
      ...incoming,
      filters: incoming.filters ?? state.filters,
      locale: incoming.locale ?? state.locale,
    })),
}));
