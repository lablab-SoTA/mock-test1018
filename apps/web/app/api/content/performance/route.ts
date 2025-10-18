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

  const page = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;
  const sliced = dataset.performance.slice(offset, offset + limit);

  return Response.json({
    meta: {
      ...buildResponseMeta({ state, tz }),
      pagination: {
        page,
        limit,
        total: dataset.performance.length,
      },
    },
    data: sliced,
  });
}
