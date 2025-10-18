import { NextRequest } from "next/server";

import { DEFAULT_TIMEZONE, ensureValidRange, getPresetRange, inferGroupBy } from "@/lib/utils/date";
import type {
  CompareMode,
  DashboardContextState,
  DashboardFilters,
  DateRangePreset,
  GroupByGranularity,
  Locale,
} from "@/lib/types";

const GROUP_BY_VALUES: GroupByGranularity[] = ["day", "week", "month"];
const COMPARE_VALUES: CompareMode[] = ["none", "previous", "yoy"];

export function parseDashboardParams(request: NextRequest): DashboardContextState {
  const searchParams = request.nextUrl.searchParams;
  const tz = searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const presetParam = (searchParams.get("preset") as DateRangePreset | null) ?? "last7";
  const compareParam = normalizeCompare(searchParams.get("compare"));
  const preset = presetParam ?? "last7";
  const compare = COMPARE_VALUES.includes(compareParam) ? compareParam : "none";
  const localeParam = searchParams.get("lang");
  const locale: Locale = localeParam === "ja" ? "ja" : "en";

  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const { range: presetRange } = getPresetRange(preset, tz);
  const range = startParam && endParam ? ensureValidRange({ start: startParam, end: endParam, timezone: tz }) : presetRange;

  const groupBy = resolveGroupBy(searchParams.get("groupBy"), range);

  return {
    range,
    preset,
    compare,
    groupBy,
    filters: parseFilters(searchParams),
    locale,
  } satisfies DashboardContextState;
}

function resolveGroupBy(candidate: string | null, range: DashboardContextState["range"]) {
  if (candidate && (GROUP_BY_VALUES as string[]).includes(candidate)) {
    return candidate as GroupByGranularity;
  }
  return inferGroupBy(range);
}

function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    platform: parseMulti(searchParams, "platform"),
    country: parseMulti(searchParams, "country"),
    device: parseMulti(searchParams, "device"),
    userType: parseMulti(searchParams, "userType"),
    product: parseMulti(searchParams, "product") as DashboardFilters["product"],
  };
}

function parseMulti(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function normalizeCompare(value: string | null): CompareMode {
  if (value === "prev") return "previous";
  if (value === "yoy" || value === "previous" || value === "none") {
    return value as CompareMode;
  }
  return "none";
}

export function buildResponseMeta({
  state,
  tz,
}: {
  state: DashboardContextState;
  tz: string;
}) {
  return {
    range: { ...state.range, tz, groupBy: state.groupBy },
    filters: state.filters,
    generated_at: new Date().toISOString(),
    compare: state.compare,
    preset: state.preset,
  };
}
