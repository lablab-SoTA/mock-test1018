import { describe, expect, it } from "vitest";

import {
  breakdownByProduct,
  calculateArppu,
  calculateChurnRate,
  calculatePaymentRate,
  calculateFunnelStages,
  calculateRetentionRate,
  delta,
  grossRevenueFromTransactions,
  netRevenueFromTransactions,
  payingUsersFromTransactions,
  safeDivide,
} from "@/lib/calc";
import type { TransactionRow } from "@/lib/types";

const SAMPLE_TRANSACTIONS: TransactionRow[] = [
  {
    transaction_id: "tx-1",
    user_id_hash: "u-1",
    product_type: "single",
    amount: 1000,
    currency: "JPY",
    tax: 100,
    discount: 50,
    status: "paid",
    paid_at_utc: new Date().toISOString(),
  },
  {
    transaction_id: "tx-2",
    user_id_hash: "u-2",
    product_type: "subscription",
    amount: 2000,
    currency: "JPY",
    tax: 200,
    discount: 0,
    status: "paid",
    paid_at_utc: new Date().toISOString(),
  },
  {
    transaction_id: "tx-3",
    user_id_hash: "u-2",
    product_type: "tip",
    amount: 500,
    currency: "JPY",
    tax: 0,
    discount: 0,
    status: "refunded",
    paid_at_utc: new Date().toISOString(),
  },
];

describe("calc utilities", () => {
  it("calculates ARPPU", () => {
    expect(calculateArppu(3000, 2)).toBeCloseTo(1500, 2);
    expect(calculateArppu(0, 0)).toBe(0);
  });

  it("calculates churn and retention", () => {
    const churn = calculateChurnRate(25, 500);
    expect(churn).toBeCloseTo(0.05, 2);
    expect(calculateRetentionRate(churn)).toBeCloseTo(0.95, 2);
  });

  it("calculates payment rate", () => {
    expect(calculatePaymentRate(250, 1000)).toBeCloseTo(0.25, 2);
    expect(calculatePaymentRate(0, 0)).toBe(0);
  });

  it("handles safe division", () => {
    expect(safeDivide(10, 2)).toBe(5);
    expect(safeDivide(10, 0)).toBe(0);
  });

  it("summarizes transactions", () => {
    expect(grossRevenueFromTransactions(SAMPLE_TRANSACTIONS)).toBe(3000);
    expect(Math.round(netRevenueFromTransactions(SAMPLE_TRANSACTIONS, 0.1))).toBe(1850);
    expect(payingUsersFromTransactions(SAMPLE_TRANSACTIONS)).toBe(2);
  });

  it("builds funnel stages", () => {
    const funnel = calculateFunnelStages({ visits: 1000, freeViews: 500, firstPurchases: 120 });
    expect(funnel[0].volume).toBe(1000);
    expect(funnel[1].conversion_rate).toBeCloseTo(0.5, 2);
    expect(funnel[2].conversion_rate).toBeCloseTo(0.24, 2);
  });

  it("computes breakdown by product", () => {
    const totals = breakdownByProduct(SAMPLE_TRANSACTIONS);
    expect(totals.single).toBe(1000);
    expect(totals.subscription).toBe(2000);
    expect(totals.tip).toBe(0);
  });

  it("computes deltas", () => {
    expect(delta(120, 100)).toBeCloseTo(0.2, 2);
    expect(delta(0, 0)).toBe(0);
  });
});
