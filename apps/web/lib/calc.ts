import type {
  FunnelStage,
  ProductType,
  TransactionRow,
} from "@/lib/types";

type SumOptions<T> = {
  items: T[];
  selector: (item: T) => number;
};

export function sumBy<T>({ items, selector }: SumOptions<T>) {
  return items.reduce((acc, item) => acc + selector(item), 0);
}

export function uniqueCount<T>(items: T[], selector: (item: T) => string) {
  return new Set(items.map(selector)).size;
}

export function safeDivide(numerator: number, denominator: number, precision = 4) {
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(precision));
}

export function calculateArppu(revenue: number, payingUsers: number) {
  return safeDivide(revenue, payingUsers, 2);
}

export function calculateChurnRate(cancellations: number, subscribersAtStart: number) {
  return safeDivide(cancellations, subscribersAtStart, 4);
}

export function calculateRetentionRate(churnRate: number) {
  return Number((1 - churnRate).toFixed(4));
}

export function calculateConversionRate(numerator: number, denominator: number) {
  return safeDivide(numerator, denominator, 4);
}

export function calculatePaymentRate(payingUsers: number, audienceSize: number) {
  return safeDivide(payingUsers, audienceSize, 4);
}

export function calculateFunnelStages({
  visits,
  freeViews,
  firstPurchases,
}: {
  visits: number;
  freeViews: number;
  firstPurchases: number;
}): FunnelStage[] {
  const visitStage: FunnelStage = {
    id: "visit",
    label: "Visits",
    volume: visits,
    conversion_rate: 1,
  };

  const viewStage: FunnelStage = {
    id: "free_view",
    label: "Free Views",
    volume: freeViews,
    conversion_rate: calculateConversionRate(freeViews, visits),
  };

  const purchaseStage: FunnelStage = {
    id: "first_purchase",
    label: "First Purchases",
    volume: firstPurchases,
    conversion_rate: calculateConversionRate(firstPurchases, freeViews),
  };

  return [visitStage, viewStage, purchaseStage];
}

export function grossRevenueFromTransactions(transactions: TransactionRow[]) {
  return sumBy({
    items: transactions,
    selector: (tx) => (tx.status === "paid" ? tx.amount : 0),
  });
}

export function netRevenueFromTransactions(transactions: TransactionRow[], feeRate = 0.12) {
  return sumBy({
    items: transactions,
    selector: (tx) => {
      if (tx.status === "refunded") {
        return -tx.amount;
      }
      const fees = tx.amount * feeRate + tx.tax;
      return tx.amount - fees - tx.discount;
    },
  });
}

export function ordersFromTransactions(transactions: TransactionRow[]) {
  return transactions.filter((tx) => tx.status === "paid").length;
}

export function payingUsersFromTransactions(transactions: TransactionRow[]) {
  return uniqueCount(
    transactions.filter((tx) => tx.status === "paid"),
    (tx) => tx.user_id_hash,
  );
}

export function breakdownByProduct(transactions: TransactionRow[]): Record<ProductType, number> {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.status === "paid") {
        acc[tx.product_type] += tx.amount;
      }
      return acc;
    },
    {
      single: 0,
      subscription: 0,
      tip: 0,
    } satisfies Record<ProductType, number>,
  );
}

export function delta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 1;
  }
  return Number(((current - previous) / previous).toFixed(4));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
