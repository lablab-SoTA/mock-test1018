import type {
  AudienceFollowersResponse,
  AudienceRealtimeResponse,
  AudienceRetentionResponse,
  DashboardFilters,
  GroupByGranularity,
  RetentionPoint,
} from "@/lib/types";

import { createMockContext, randomBetween, randomInt } from "./common";

type AudienceDataset = {
  followers: AudienceFollowersResponse["data"];
  retention: AudienceRetentionResponse["data"];
  realtime: AudienceRealtimeResponse["data"];
  sevenDayRetention: number;
  thirtyDayRetention: number;
};

export function generateAudienceDataset({
  range,
  groupBy,
  filters,
  compare,
}: {
  range: { start: string; end: string };
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  compare: "none" | "previous" | "yoy";
}): AudienceDataset {
  const ctx = createMockContext({ domain: "audience", range, groupBy, filters, compare });

  const followersTrend = buildFollowersTrend(ctx);
  const retention = buildRetention(ctx);
  const realtime = buildRealtime(ctx);

  return {
    followers: followersTrend,
    retention,
    realtime,
    sevenDayRetention: retention.find((item) => item.cohort_start === "7d")?.retention_rate ?? 0.0,
    thirtyDayRetention: retention.find((item) => item.cohort_start === "30d")?.retention_rate ?? 0.0,
  };
}

function buildFollowersTrend(ctx: ReturnType<typeof createMockContext>) {
  const base = randomInt(280_000, 410_000, ctx.random);
  let runningTotal = base;

  return ctx.buckets.map((bucket, index) => {
    const newFollowers = Math.round(randomBetween(900, 2100, ctx.random) * (1 + Math.sin(index / 3) * 0.1));
    const churned = Math.round(newFollowers * randomBetween(0.35, 0.55, ctx.random));
    runningTotal += newFollowers - churned;

    return {
      date: bucket.start,
      followers_total: Math.max(0, Math.round(runningTotal)),
      followers_new: newFollowers,
      followers_churned: churned,
    };
  });
}

function buildRetention(ctx: ReturnType<typeof createMockContext>) {
  const cohorts: RetentionPoint[] = [];
  const definitions = [
    { label: "7d", base: 0.42 },
    { label: "30d", base: 0.31 },
    { label: "90d", base: 0.22 },
  ];

  definitions.forEach(({ label, base }) => {
    const retention = base * randomBetween(0.9, 1.08, ctx.random);
    cohorts.push({
      cohort_start: label,
      retention_rate: Number(retention.toFixed(3)),
      churn_rate: Number((1 - retention).toFixed(3)),
    });
  });

  return cohorts;
}

function buildRealtime(ctx: ReturnType<typeof createMockContext>) {
  const activeUsers = Math.round(randomBetween(950, 3_800, ctx.random));
  return {
    active_users: activeUsers,
    polled_at: new Date().toISOString(),
  };
}
