import { NextRequest } from "next/server";

import { buildResponseMeta, parseDashboardParams } from "@/lib/api/params";
import { generateContentDataset } from "@/lib/mock-data/content";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const state = parseDashboardParams(request);
  const tz = request.nextUrl.searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const dataset = generateContentDataset({
    range: state.range,
    groupBy: state.groupBy,
    filters: state.filters,
    compare: state.compare,
  });

  return Response.json({
    meta: buildResponseMeta({ state, tz }),
    data: dataset.watchTimeTrend,
  });
}
