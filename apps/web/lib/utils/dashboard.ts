import type { DashboardContextState, DashboardFilters } from "@/lib/types";

const FILTER_KEYS: Array<keyof DashboardFilters> = ["platform", "country", "device", "userType", "product"];

export function buildDashboardSearchParams(
  state: Pick<DashboardContextState, "range" | "preset" | "compare" | "groupBy" | "filters" | "locale">,
) {
  const params = new URLSearchParams();
  params.set("preset", state.preset);
  params.set("start", state.range.start);
  params.set("end", state.range.end);
  params.set("groupBy", state.groupBy);
  if (state.compare !== "none") {
    params.set("compare", state.compare === "previous" ? "prev" : "yoy");
  }
  if (state.locale && state.locale !== "en") {
    params.set("lang", state.locale);
  } else {
    params.delete("lang");
  }
  FILTER_KEYS.forEach((key) => {
    const values = state.filters[key];
    if (values?.length) {
      params.set(key, [...values].sort().join(","));
    }
  });
  return params;
}
