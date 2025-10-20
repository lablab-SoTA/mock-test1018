import { NextRequest } from "next/server";

import { delta } from "@/lib/calc";
import { buildResponseMeta, parseDashboardParams } from "@/lib/api/params";
import { generateRevenueDataset } from "@/lib/mock-data/revenue";
import { DEFAULT_TIMEZONE, shiftRange } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const state = parseDashboardParams(request);
  const tz = request.nextUrl.searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const dataset = generateRevenueDataset({
    range: state.range,
    groupBy: state.groupBy,
    filters: state.filters,
    compare: state.compare,
  });

  const summary = { ...dataset.summary };

  if (state.compare !== "none") {
    const compareRange = shiftRange(state.range, state.compare, state.groupBy);
    const compareDataset = generateRevenueDataset({
      range: compareRange,
      groupBy: state.groupBy,
      filters: state.filters,
      compare: "none",
    });

    summary.deltas = {
      ...(state.compare === "previous"
        ? { vsPrev: delta(summary.gross, compareDataset.summary.gross) }
        : { yoy: delta(summary.gross, compareDataset.summary.gross) }),
    };
  }

  const {
    subscribers_at_start: ignoredSubscribers,
    cancellations: ignoredCancellations,
    audience_size: ignoredAudience,
    ...payload
  } = summary;
  void ignoredSubscribers;
  void ignoredCancellations;
  void ignoredAudience;

  return Response.json({
    meta: buildResponseMeta({ state, tz }),
    data: payload,
  });
}
