import {
  breakdownByProduct,
  calculateArppu,
  calculateChurnRate,
  calculateRetentionRate,
  grossRevenueFromTransactions,
  netRevenueFromTransactions,
  ordersFromTransactions,
  payingUsersFromTransactions,
} from "@/lib/calc";
import type {
  DashboardFilters,
  GroupByGranularity,
  ProductType,
  RevenueBreakdownItem,
  RevenueSummary,
  TransactionRow,
} from "@/lib/types";
import { createMockContext, randomBetween, randomInt, randomTimeWithinBucket } from "./common";

type RevenueDataset = {
  transactions: TransactionRow[];
  summary: RevenueSummary & { subscribers_at_start: number; cancellations: number };
  breakdown: RevenueBreakdownItem[];
};

const PRODUCT_PRICING: Record<ProductType, { min: number; max: number }> = {
  single: { min: 800, max: 7000 },
  subscription: { min: 1200, max: 5000 },
  tip: { min: 300, max: 2500 },
};

const PRODUCT_FEES: Record<ProductType, number> = {
  single: 0.12,
  subscription: 0.1,
  tip: 0.08,
};

export function generateRevenueDataset({
  range,
  groupBy,
  filters,
  compare,
}: {
  range: { start: string; end: string };
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  compare: "none" | "previous" | "yoy";
}, seedKey = "revenue"): RevenueDataset {
  const ctx = createMockContext({ domain: `${seedKey}`, range, groupBy, filters, compare });
  const transactions = buildTransactions(ctx);
  const { summary, breakdown } = buildAggregations(ctx, transactions);

  return {
    transactions,
    summary,
    breakdown,
  } as RevenueDataset;
}

function buildTransactions(ctx: ReturnType<typeof createMockContext>): TransactionRow[] {
  const userPool = new Map<string, { purchases: number }>();
  const result: TransactionRow[] = [];

  ctx.buckets.forEach((bucket, bucketIndex) => {
    const bucketMultiplier = 1 + Math.sin(bucketIndex / 1.5) * 0.2;
    const baseOrders = randomBetween(120, 220, ctx.random) * bucketMultiplier;

    (Object.keys(PRODUCT_PRICING) as ProductType[]).forEach((productType, productIndex) => {
      const productWeight = productType === "subscription" ? 0.35 : productType === "tip" ? 0.2 : 0.45;
      const orderCount = Math.max(10, Math.round(baseOrders * productWeight * randomBetween(0.8, 1.2, ctx.random)));

      for (let i = 0; i < orderCount; i += 1) {
        const price = randomBetween(PRODUCT_PRICING[productType].min, PRODUCT_PRICING[productType].max, ctx.random);
        const currency = "JPY";
        const tax = price * randomBetween(0.06, 0.1, ctx.random);
        const discount = productType === "single" ? price * randomBetween(0.03, 0.08, ctx.random) : 0;
        const statusRoll = ctx.random();
        const status = statusRoll > 0.96 ? "refunded" : "paid";

        const userKeyIndex = randomInt(1, 6_000, ctx.random);
        const userId = `u-${userKeyIndex.toString().padStart(4, "0")}`;
        const userEntry = userPool.get(userId) ?? { purchases: 0 };
        userEntry.purchases += 1;
        userPool.set(userId, userEntry);

        const transaction: TransactionRow = {
          transaction_id: `tx-${bucketIndex}-${productIndex}-${i}`,
          user_id_hash: userId,
          content_id: `content-${randomInt(1, 24, ctx.random)}`,
          product_type: productType,
          amount: Math.round(price),
          currency,
          tax: Math.round(tax),
          discount: Math.round(discount),
          status,
          paid_at_utc: randomTimeWithinBucket(bucket.start, bucket.end, ctx.random),
          source: ctx.filters.userType.length
            ? ctx.filters.userType[0]
            : pickSourceByProduct(productType, ctx.random),
          platform: ctx.filters.platform[0] ?? pickPlatformByAffinity(productType, ctx.random),
          device: ctx.filters.device[0] ?? pickDeviceByProduct(productType, ctx.random),
          country: ctx.filters.country[0] ?? pickCountryByProduct(productType, ctx.random),
        };

        result.push(transaction);
      }
    });
  });

  return result.sort((a, b) => a.paid_at_utc.localeCompare(b.paid_at_utc));
}

function buildAggregations(ctx: ReturnType<typeof createMockContext>, transactions: TransactionRow[]) {
  const gross = grossRevenueFromTransactions(transactions);
  const net = netRevenueFromTransactions(transactions, averageFee(transactions));
  const orders = ordersFromTransactions(transactions);
  const payingUsers = payingUsersFromTransactions(transactions);

  const baselineSubscribers = Math.max(
    400,
    Math.round(payingUsers * randomBetween(1.4, 1.8, ctx.random)),
  );
  const cancellations = Math.round(baselineSubscribers * randomBetween(0.03, 0.08, ctx.random));

  const churnRate = calculateChurnRate(cancellations, baselineSubscribers);
  const retentionRate = calculateRetentionRate(churnRate);

  const breakdownTotals = breakdownByProduct(transactions);
  const breakdown: RevenueBreakdownItem[] = (Object.keys(breakdownTotals) as ProductType[]).map((label) => ({
    label,
    revenue: Math.round(breakdownTotals[label]),
    share: breakdownTotals[label] === 0 ? 0 : breakdownTotals[label] / gross,
  }));

  const summary: RevenueSummary & { subscribers_at_start: number; cancellations: number } = {
    gross: Math.round(gross),
    net: Math.round(net),
    orders,
    paying_users: payingUsers,
    arppu: calculateArppu(gross, payingUsers),
    churn_rate: churnRate,
    retention_rate: retentionRate,
    subscribers_at_start: baselineSubscribers,
    cancellations,
  };

  return { summary, breakdown };
}

function pickSourceByProduct(product: ProductType, random: () => number) {
  const roll = random();
  if (product === "subscription") return roll < 0.5 ? "Direct" : "Email";
  if (product === "single") return roll < 0.5 ? "Search" : "Social";
  return roll < 0.5 ? "Community" : "Live";
}

function pickPlatformByAffinity(product: ProductType, random: () => number) {
  const roll = random();
  if (product === "subscription") return roll > 0.5 ? "YouTube" : "Twitch";
  if (product === "single") return roll > 0.5 ? "Instagram" : "TikTok";
  return roll > 0.5 ? "X" : "YouTube";
}

function pickDeviceByProduct(product: ProductType, random: () => number) {
  const roll = random();
  if (product === "subscription") return roll > 0.7 ? "desktop" : "mobile";
  if (product === "tip") return roll > 0.6 ? "mobile" : "desktop";
  return roll > 0.5 ? "mobile" : "tablet";
}

function pickCountryByProduct(product: ProductType, random: () => number) {
  const roll = random();
  if (product === "subscription") return roll > 0.6 ? "JP" : roll > 0.3 ? "US" : "KR";
  if (product === "tip") return roll > 0.6 ? "US" : roll > 0.3 ? "GB" : "JP";
  return roll > 0.5 ? "JP" : "TW";
}

function averageFee(transactions: TransactionRow[]) {
  const totals: Record<ProductType, { sum: number; count: number }> = {
    single: { sum: 0, count: 0 },
    subscription: { sum: 0, count: 0 },
    tip: { sum: 0, count: 0 },
  };

  transactions.forEach((tx) => {
    totals[tx.product_type].sum += PRODUCT_FEES[tx.product_type];
    totals[tx.product_type].count += 1;
  });

  const blended = (Object.keys(totals) as ProductType[]).reduce((acc, key) => {
    const { sum, count } = totals[key];
    if (count === 0) return acc;
    return acc + sum / count;
  }, 0);

  return blended / 3 || 0.12;
}
