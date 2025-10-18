import { calculateConversionRate, calculateFunnelStages, safeDivide } from "@/lib/calc";
import type {
  AcquisitionFunnelResponse,
  AcquisitionPlatformArpuResponse,
  DashboardFilters,
  GroupByGranularity,
  SourcePerformance,
  TrafficMixPoint,
} from "@/lib/types";

import {
  PLATFORMS,
  SOURCES,
  createMockContext,
  randomBetween,
} from "./common";

type AcquisitionDataset = {
  funnel: AcquisitionFunnelResponse["data"];
  sources: SourcePerformance[];
  platformArpu: AcquisitionPlatformArpuResponse["data"];
  mix: TrafficMixPoint[];
  avgTimeToFirstPurchaseHours: number;
  externalShare: number;
};

export function generateAcquisitionDataset({
  range,
  groupBy,
  filters,
  compare,
}: {
  range: { start: string; end: string };
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  compare: "none" | "previous" | "yoy";
}): AcquisitionDataset {
  const ctx = createMockContext({ domain: "acquisition", range, groupBy, filters, compare });

  const funnelTotals = buildFunnelTotals(ctx);
  const sources = buildSources(ctx, funnelTotals);
  const platformArpu = buildPlatformArpu(ctx, funnelTotals);
  const mix = buildTrafficMix(ctx, funnelTotals);

  const avgTimeToFirstPurchaseHours = randomBetween(9, 26, ctx.random);
  const externalShare = calculateConversionRate(
    sources.filter((source) => isExternal(source.source)).reduce((acc, value) => acc + value.visits, 0),
    sources.reduce((acc, value) => acc + value.visits, 0),
  );

  return {
    funnel: calculateFunnelStages(funnelTotals),
    sources,
    platformArpu,
    mix,
    avgTimeToFirstPurchaseHours,
    externalShare,
  };
}

function buildFunnelTotals(ctx: ReturnType<typeof createMockContext>) {
  const dailyVisits = ctx.buckets.map((bucket, idx) => {
    const base = randomBetween(7000, 14000, ctx.random);
    const seasonal = 1 + Math.sin(idx / 2) * 0.15;
    return base * seasonal;
  });

  const visits = Math.round(dailyVisits.reduce((acc, value) => acc + value, 0));
  const freeViews = Math.round(visits * randomBetween(0.65, 0.8, ctx.random));
  const firstPurchases = Math.round(freeViews * randomBetween(0.08, 0.12, ctx.random));

  return { visits, freeViews, firstPurchases };
}

function buildSources(
  ctx: ReturnType<typeof createMockContext>,
  totals: { visits: number; freeViews: number; firstPurchases: number },
) {
  const weights = SOURCES.map((_, index) => 1 + Math.cos(index));
  const visitAllocations = distribute(totals.visits, weights, ctx.random);
  const freeViewAllocations = distribute(totals.freeViews, weights, ctx.random);
  const purchaseAllocations = distribute(totals.firstPurchases, weights, ctx.random);

  return SOURCES.map((source, index) => {
    const visits = Math.round(visitAllocations[index]);
    const freeViews = Math.round(freeViewAllocations[index]);
    const firstPurchases = Math.max(0, Math.round(purchaseAllocations[index]));
    const revenue = firstPurchases * randomBetween(1800, 3400, ctx.random);
    const arpu = safeDivide(revenue, Math.max(1, visits));

    return {
      source,
      visits,
      free_views: freeViews,
      first_purchases: firstPurchases,
      conversion_rate: calculateConversionRate(firstPurchases, visits),
      arpu,
      revenue,
    } satisfies SourcePerformance;
  });
}

function buildPlatformArpu(
  ctx: ReturnType<typeof createMockContext>,
  totals: { visits: number; firstPurchases: number },
) {
  const allocations = distribute(totals.firstPurchases, PLATFORMS.map((_, idx) => 1 + Math.sin(idx)), ctx.random);

  return PLATFORMS.map((platform, index) => {
    const purchasers = Math.max(1, allocations[index]);
    const revenue = purchasers * randomBetween(2200, 4200, ctx.random);
    const arpu = safeDivide(revenue, Math.max(1, totals.visits * 0.2));

    return {
      platform,
      arpu,
      revenue,
    };
  });
}

function buildTrafficMix(
  ctx: ReturnType<typeof createMockContext>,
  totals: { visits: number },
) {
  const mix: TrafficMixPoint[] = [];

  ctx.buckets.forEach((bucket, index) => {
    const baseline = totals.visits / ctx.buckets.length;
    const external = baseline * randomBetween(0.35, 0.6, ctx.random);
    const internal = baseline * randomBetween(0.25, 0.45, ctx.random);
    const direct = Math.max(0, baseline - external - internal);

    mix.push({
      date: bucket.start,
      external: Math.round(external * (1 + Math.sin(index / 2) * 0.05)),
      internal: Math.round(internal * (1 + Math.cos(index / 2) * 0.05)),
      direct: Math.round(direct),
    });
  });

  return mix;
}

function distribute(total: number, weights: number[], random: () => number) {
  const weightSum = weights.reduce((acc, weight) => acc + Math.max(weight, 0.2), 0);
  const normalized = weights.map((weight) => Math.max(weight, 0.2) / weightSum);

  let remainder = total;
  const allocation = normalized.map((ratio) => {
    const amount = total * ratio * randomBetween(0.85, 1.15, random);
    remainder -= amount;
    return amount;
  });

  if (remainder !== 0) {
    const adjustment = remainder / allocation.length;
    return allocation.map((value) => Math.max(0, value + adjustment));
  }

  return allocation;
}

function isExternal(source: string) {
  return ["Search", "Social", "Referral", "Paid Ads", "Affiliate"].includes(source);
}
