import { NextRequest } from "next/server";

import { buildResponseMeta, parseDashboardParams } from "@/lib/api/params";
import { generateRevenueDataset } from "@/lib/mock-data/revenue";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const state = parseDashboardParams(request);
  const tz = request.nextUrl.searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const dataset = generateRevenueDataset({
    range: state.range,
    groupBy: state.groupBy,
    filters: state.filters,
    compare: state.compare,
  });

  return Response.json({
    meta: buildResponseMeta({ state, tz }),
    data: dataset.breakdown,
  });
}
