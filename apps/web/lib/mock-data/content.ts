import { safeDivide } from "@/lib/calc";
import type {
  ContentPerformanceResponse,
  ContentTopResponse,
  DashboardFilters,
  GroupByGranularity,
  WatchTimeTrendPoint,
} from "@/lib/types";

import {
  CONTENT_GENRES,
  CONTENT_STATUSES,
  PLATFORMS,
  createMockContext,
  generateId,
  randomBetween,
  randomInt,
} from "./common";

type ContentDataset = {
  performance: ContentPerformanceResponse["data"];
  topPerformers: ContentTopResponse["data"];
  watchTimeTrend: WatchTimeTrendPoint[];
};

export function generateContentDataset({
  range,
  groupBy,
  filters,
  compare,
}: {
  range: { start: string; end: string };
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  compare: "none" | "previous" | "yoy";
}): ContentDataset {
  const ctx = createMockContext({ domain: "content", range, groupBy, filters, compare });

  const performance = buildPerformanceRows(ctx);
  const topPerformers = performance
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(({ content_id, title, revenue, views }) => ({ content_id, title, revenue, views }));

  const watchTimeTrend = buildWatchTimeTrend(ctx, performance);

  return {
    performance,
    topPerformers,
    watchTimeTrend,
  };
}

function buildPerformanceRows(ctx: ReturnType<typeof createMockContext>) {
  const rows = Array.from({ length: 30 }).map((_, index) => {
    const title = `Episode ${index + 1}: ${CONTENT_GENRES[index % CONTENT_GENRES.length]} Highlights`;
    const uniqueViewers = randomInt(12_000, 85_000, ctx.random);
    const views = Math.round(uniqueViewers * randomBetween(1.2, 2.8, ctx.random));
    const sales = Math.round(uniqueViewers * randomBetween(0.02, 0.08, ctx.random));
    const revenue = Math.round(sales * randomBetween(1800, 4200, ctx.random));
    const avgWatch = Math.round(randomBetween(220, 980, ctx.random));
    const likes = Math.round(views * randomBetween(0.01, 0.08, ctx.random));
    const comments = Math.round(views * randomBetween(0.002, 0.01, ctx.random));
    const reposts = Math.round(views * randomBetween(0.001, 0.004, ctx.random));
    const status = CONTENT_STATUSES[index % CONTENT_STATUSES.length];

    return {
      content_id: generateId("content", index, ctx.random),
      title,
      views,
      unique_viewers: uniqueViewers,
      sales,
      revenue,
      conversion_rate: safeDivide(sales, uniqueViewers),
      avg_watch_time_sec: avgWatch,
      likes,
      comments,
      reposts,
      status,
      platform: filtersPlatform(ctx, index),
      creator_segment: CONTENT_GENRES[index % CONTENT_GENRES.length],
    } satisfies ContentPerformanceResponse["data"][number];
  });

  return rows.sort((a, b) => b.revenue - a.revenue);
}

function filtersPlatform(ctx: ReturnType<typeof createMockContext>, index: number) {
  if (ctx.filters.platform.length) return ctx.filters.platform[0];
  return PLATFORMS[index % PLATFORMS.length];
}

function buildWatchTimeTrend(
  ctx: ReturnType<typeof createMockContext>,
  performance: ContentPerformanceResponse["data"],
) {
  const totalAvgWatch = performance.reduce((acc, row) => acc + row.avg_watch_time_sec, 0);
  const baseline = totalAvgWatch / performance.length;

  return ctx.buckets.map((bucket, index) => ({
    date: bucket.start,
    avg_watch_time_sec: Math.round(
      baseline * randomBetween(0.88, 1.12, ctx.random) * (1 + Math.sin(index / 2) * 0.05),
    ),
  }));
}
