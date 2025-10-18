import { NextRequest } from "next/server";

import { buildResponseMeta, parseDashboardParams } from "@/lib/api/params";
import { generateAcquisitionDataset } from "@/lib/mock-data/acquisition";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const state = parseDashboardParams(request);
  const tz = request.nextUrl.searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const dataset = generateAcquisitionDataset({
    range: state.range,
    groupBy: state.groupBy,
    filters: state.filters,
    compare: state.compare,
  });

  return Response.json({
    meta: {
      ...buildResponseMeta({ state, tz }),
      metrics: {
        avg_time_to_first_purchase_hours: dataset.avgTimeToFirstPurchaseHours,
        external_share: dataset.externalShare,
      },
    },
    data: dataset.funnel,
  });
}
