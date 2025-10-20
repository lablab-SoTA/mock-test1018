"use client";

import { useMemo, useState } from "react";

import { WidgetMenu } from "@/components/common/WidgetMenu";
import { WidgetShell } from "@/components/common/WidgetShell";
import { BarChartX } from "@/components/charts/BarChartX";
import { PieChartX } from "@/components/charts/PieChartX";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type ColumnDefinition } from "@/components/tables/DataTable";
import { TransactionsTable } from "@/components/tables/TransactionsTable";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import {
  useRevenueBreakdown,
  useRevenueSummary,
  useRevenueTopPayers,
  useRevenueTransactions,
} from "@/lib/hooks/use-revenue-data";
import { buildRevenueTrend } from "@/lib/utils/revenue";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";
import type { ProductType, RevenueBreakdownItem, TopPayerRow, TransactionRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildCsv, downloadCsv, notifyCsvError } from "@/lib/csv";
import { productLabelKeys } from "@/lib/i18n";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type Translator = (key: TranslationKey, params?: Record<string, string | number>) => string;
const EMPTY_BREAKDOWN: RevenueBreakdownItem[] = [];

export function RevenueDashboard() {
  const { t, locale } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<"all" | ProductType>("all");
  const [trendAsTable, setTrendAsTable] = useState(false);
  const [breakdownAsTable, setBreakdownAsTable] = useState(false);
  const [topPayersAsTable, setTopPayersAsTable] = useState(true);

  const summaryQuery = useRevenueSummary();
  const breakdownQuery = useRevenueBreakdown();
  const transactionsQuery = useRevenueTransactions();
  const topPayersQuery = useRevenueTopPayers();

  const trendData = useMemo(() => {
    if (!transactionsQuery.data) return [];
    return buildRevenueTrend(
      transactionsQuery.data.rows,
      {
        range: transactionsQuery.data.meta.range,
        groupBy: transactionsQuery.data.meta.range.groupBy,
      },
      selectedProduct,
    );
  }, [transactionsQuery.data, selectedProduct]);

  const breakdownData = breakdownQuery.data?.data ?? EMPTY_BREAKDOWN;
  const topPayers = topPayersQuery.data?.data ?? [];
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";

  const topPayerColumns = useMemo<ColumnDefinition<TopPayerRow>[]>(
    () => [
      { key: "user_id_hash", header: t("revenue.payers.column.user") },
      {
        key: "total_revenue",
        header: t("revenue.payers.column.total"),
        align: "right",
        sortable: true,
        render: (row) => formatCurrency(row.total_revenue, { decimals: true }),
      },
      {
        key: "orders",
        header: t("revenue.payers.column.orders"),
        align: "right",
        sortable: true,
        render: (row) => formatNumber(row.orders),
      },
      {
        key: "avg_order_value",
        header: t("revenue.payers.column.aov"),
        align: "right",
        sortable: true,
        render: (row) => formatCurrency(row.avg_order_value, { decimals: true }),
      },
      {
        key: "last_purchase_utc",
        header: t("revenue.payers.column.last"),
        render: (row) => new Date(row.last_purchase_utc).toLocaleString(localeCode),
      },
    ],
    [localeCode, t],
  );

  const pieData = useMemo(
    () =>
      breakdownData.map((item, index) => ({
        id: item.label,
        label: t(productLabelKeys[item.label]),
        value: item.revenue,
        color: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [breakdownData, t],
  );

  const filteredTransactions = useMemo(() => {
    if (!transactionsQuery.data) return [];
    if (selectedProduct === "all") return transactionsQuery.data.rows;
    return transactionsQuery.data.rows.filter((row) => row.product_type === selectedProduct);
  }, [transactionsQuery.data, selectedProduct]);

  const exportTrendCsv = () => {
    try {
      const csv = buildCsv(trendData, [
        { key: "label", header: "date" },
        { key: "revenue", header: "revenue" },
      ]);
      downloadCsv("revenue_trend.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportBreakdownCsv = () => {
    try {
      const csv = buildCsv(breakdownData, [
        { key: "label", header: "product_type" },
        { key: "revenue", header: "revenue" },
      ]);
      downloadCsv("revenue_breakdown.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportTopPayersCsv = () => {
    try {
      const csv = buildCsv(topPayers, [
        { key: "user_id_hash", header: "user_id_hash" },
        { key: "total_revenue", header: "total_revenue" },
        { key: "orders", header: "orders" },
        { key: "avg_order_value", header: "avg_order_value" },
        { key: "last_purchase_utc", header: "last_purchase_utc" },
      ]);
      downloadCsv("top_payers.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportTransactionsCsv = () => {
    try {
      const csv = buildCsv(filteredTransactions, [
        { key: "transaction_id", header: "transaction_id" },
        { key: "paid_at_utc", header: "paid_at_utc" },
        { key: "user_id_hash", header: "user_id_hash" },
        { key: "product_type", header: "product_type" },
        { key: "amount", header: "amount", transform: (value) => Number(value) },
        { key: "tax", header: "tax", transform: (value) => Number(value) },
        { key: "discount", header: "discount", transform: (value) => Number(value) },
        { key: "status", header: "status" },
        { key: "source", header: "source" },
        { key: "platform", header: "platform" },
        { key: "device", header: "device" },
        { key: "country", header: "country" },
      ]);
      downloadCsv("transactions.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  if (
    summaryQuery.isLoading ||
    breakdownQuery.isLoading ||
    transactionsQuery.isLoading ||
    topPayersQuery.isLoading
  ) {
    return <div className="grid gap-4">{t("revenue.loading")}</div>;
  }

  if (
    summaryQuery.isError ||
    breakdownQuery.isError ||
    transactionsQuery.isError ||
    topPayersQuery.isError
  ) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {t("revenue.error")}
      </div>
    );
  }

  const summary = summaryQuery.data?.data;
  if (!summary) {
    return null;
  }

  const productLabel = getProductLabel(t, selectedProduct);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t("revenue.kpi.gross")}
          value={formatCurrency(summary.gross, { decimals: true })}
          delta={summary.deltas?.vsPrev ?? summary.deltas?.yoy ?? null}
          deltaLabel={
            summary.deltas?.vsPrev
              ? t("revenue.delta.vsPrevious")
              : summary.deltas?.yoy
                ? t("revenue.delta.vsLastYear")
                : undefined
          }
          helpText={t("revenue.kpi.gross.help")}
        />
        <KpiCard
          label={t("revenue.kpi.net")}
          value={formatCurrency(summary.net, { decimals: true })}
          helpText={t("revenue.kpi.net.help")}
        />
        <KpiCard
          label={t("revenue.kpi.payingUsers")}
          value={formatNumber(summary.paying_users)}
          helpText={t("revenue.kpi.payingUsers.help")}
        />
        <KpiCard
          label={t("revenue.kpi.paymentRate")}
          value={formatPercent(summary.payment_rate)}
          helpText={t("revenue.kpi.paymentRate.help")}
        />
        <KpiCard
          label={t("revenue.kpi.churn")}
          value={formatPercent(summary.churn_rate)}
          delta={summary.retention_rate - 1}
          deltaLabel={t("revenue.kpi.churn.delta")}
          helpText={t("revenue.kpi.churn.help")}
        />
      </section>

      <section>
        <WidgetShell
          title={t("revenue.payers.title")}
          description={t("revenue.payers.description")}
          actions={
            <WidgetMenu
              onDownloadCsv={exportTopPayersCsv}
              onToggleTable={
                topPayers.length > 0 ? () => setTopPayersAsTable((prev) => !prev) : undefined
              }
            />
          }
        >
          {topPayersAsTable || topPayers.length === 0 ? (
            <DataTable
              data={topPayers}
              columns={topPayerColumns}
              ariaLabel={t("revenue.payers.tableAria")}
              pageSize={10}
            />
          ) : (
            <div className="space-y-3 text-sm">
              {topPayers.map((payer, index) => (
                <div
                  key={payer.user_id_hash}
                  className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">{payer.user_id_hash}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("revenue.payers.column.last")}:{" "}
                        {new Date(payer.last_purchase_utc).toLocaleString(localeCode)}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-semibold">
                      {formatCurrency(payer.total_revenue, { decimals: true })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("revenue.payers.column.orders")}: {formatNumber(payer.orders)} ・{" "}
                      {t("revenue.payers.column.aov")}:{" "}
                      {formatCurrency(payer.avg_order_value, { decimals: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetShell>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <WidgetShell
          title={t("revenue.trend.title")}
          description={
            selectedProduct === "all"
              ? t("revenue.trend.descriptionAll")
              : t("revenue.trend.descriptionProduct", { product: productLabel })
          }
          actions={
            <WidgetMenu onDownloadCsv={exportTrendCsv} onToggleTable={() => setTrendAsTable((prev) => !prev)} />
          }
        >
          {trendAsTable ? (
            <DataTable
              data={trendData}
              columns={[
                { key: "label", header: t("common.date") },
                { key: "revenue", header: t("revenue.label"), align: "right" },
              ]}
              ariaLabel={t("revenue.trend.tableAria")}
              searchable={false}
            />
          ) : (
            <BarChartX
              data={trendData}
              xKey="label"
              series={[{ dataKey: "revenue", label: t("revenue.label"), color: "hsl(var(--chart-1))" }]}
              ariaLabel={t("revenue.trend.chartAria")}
            />
          )}
        </WidgetShell>

        <WidgetShell
          title={t("revenue.mix.title")}
          description={t("revenue.mix.description")}
          actions={
            <WidgetMenu onDownloadCsv={exportBreakdownCsv} onToggleTable={() => setBreakdownAsTable((prev) => !prev)} />
          }
        >
          {breakdownAsTable ? (
            <DataTable
              data={pieData}
              columns={[
                { key: "label", header: t("revenue.mix.column.product") },
                { key: "value", header: t("revenue.mix.column.revenue"), align: "right" },
              ]}
              ariaLabel={t("revenue.mix.tableAria")}
              searchable={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChartX
                data={pieData}
                ariaLabel={t("revenue.mix.chartAria")}
                onSliceClick={(slice) => {
                  const next = selectedProduct === slice.id ? "all" : (slice.id as ProductType);
                  setSelectedProduct(next);
                }}
              />
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <button
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1",
                    selectedProduct === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                  onClick={() => setSelectedProduct("all")}
                >
                  {t("product.all")}
                </button>
                {pieData.map((slice) => (
                  <button
                    key={slice.id ?? slice.label}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1",
                      selectedProduct === slice.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() =>
                      setSelectedProduct((prev) =>
                        prev === slice.id ? "all" : (slice.id as ProductType),
                      )
                    }
                  >
                    {slice.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </WidgetShell>
      </section>

      <section>
        <WidgetShell
          title={t("revenue.transactions.title")}
          description={
            selectedProduct === "all"
              ? t("revenue.transactions.descriptionAll")
              : t("revenue.transactions.descriptionProduct", { product: productLabel })
          }
          actions={<WidgetMenu onDownloadCsv={exportTransactionsCsv} />}
        >
          <TransactionsTable data={filteredTransactions as TransactionRow[]} />
        </WidgetShell>
      </section>
    </div>
  );
}

function getProductLabel(t: Translator, value: ProductType | "all") {
  if (value === "all") return t("product.all");
  return t(productLabelKeys[value]);
}
