import { NextRequest } from "next/server";

import { buildResponseMeta, parseDashboardParams } from "@/lib/api/params";
import { generateAudienceDataset } from "@/lib/mock-data/audience";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const state = parseDashboardParams(request);
  const tz = request.nextUrl.searchParams.get("tz") ?? DEFAULT_TIMEZONE;
  const dataset = generateAudienceDataset({
    range: state.range,
    groupBy: state.groupBy,
    filters: state.filters,
    compare: state.compare,
  });

  const base = dataset.realtime.active_users;
  const noise = Math.round((Math.random() - 0.5) * base * 0.12);
  const activeUsers = Math.max(0, base + noise);

  return Response.json({
    meta: buildResponseMeta({ state, tz }),
    data: {
      active_users: activeUsers,
      polled_at: new Date().toISOString(),
    },
  });
}
