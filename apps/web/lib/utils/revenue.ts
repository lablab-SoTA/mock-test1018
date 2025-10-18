import { createBuckets } from "@/lib/utils/date";
import type { DashboardContextState, ProductType, TransactionRow } from "@/lib/types";

export function buildRevenueTrend(transactions: TransactionRow[], state: Pick<DashboardContextState, "range" | "groupBy">, productFilter: ProductType | "all" = "all") {
  const buckets = createBuckets(state.range, state.groupBy);
  return buckets.map((bucket) => {
    const bucketRevenue = transactions
      .filter((tx) =>
        tx.status === "paid" &&
        new Date(tx.paid_at_utc).getTime() >= new Date(bucket.start).getTime() &&
        new Date(tx.paid_at_utc).getTime() <= new Date(bucket.end).getTime() &&
        (productFilter === "all" || tx.product_type === productFilter),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      label: bucket.label,
      revenue: Math.round(bucketRevenue),
    };
  });
}

export function sumTransactions(transactions: TransactionRow[], productFilter: ProductType | "all" = "all") {
  return transactions
    .filter((tx) => tx.status === "paid" && (productFilter === "all" || tx.product_type === productFilter))
    .reduce((sum, tx) => sum + tx.amount, 0);
}
