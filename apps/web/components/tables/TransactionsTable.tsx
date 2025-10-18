"use client";

import { useMemo } from "react";

import { DataTable, type ColumnDefinition } from "@/components/tables/DataTable";
import { useTranslation } from "@/lib/hooks/use-translation";
import { productLabelKeys } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils/format";
import type { TransactionRow } from "@/lib/types";

type TransactionsTableProps = {
  data: TransactionRow[];
};

export function TransactionsTable({ data }: TransactionsTableProps) {
  const { t, locale } = useTranslation();
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";

  const columns = useMemo<ColumnDefinition<TransactionRow>[]>(
    () => [
      { key: "transaction_id", header: t("transactions.column.id") },
      {
        key: "paid_at_utc",
        header: t("transactions.column.paidAt"),
        render: (row) => new Date(row.paid_at_utc).toLocaleString(localeCode),
      },
      { key: "user_id_hash", header: t("transactions.column.user") },
      {
        key: "product_type",
        header: t("transactions.column.product"),
        sortable: true,
        render: (row) => t(productLabelKeys[row.product_type]),
      },
      {
        key: "amount",
        header: t("transactions.column.amount"),
        sortable: true,
        align: "right",
        render: (row) => formatCurrency(row.amount, { decimals: true }),
      },
      {
        key: "tax",
        header: t("transactions.column.tax"),
        sortable: true,
        align: "right",
        render: (row) => formatCurrency(row.tax, { decimals: true }),
      },
      {
        key: "discount",
        header: t("transactions.column.discount"),
        sortable: true,
        align: "right",
        render: (row) => formatCurrency(row.discount, { decimals: true }),
      },
      { key: "status", header: t("transactions.column.status"), sortable: true },
      { key: "source", header: t("transactions.column.source") },
      { key: "platform", header: t("transactions.column.platform") },
      { key: "device", header: t("transactions.column.device") },
      { key: "country", header: t("transactions.column.country"), sortable: true },
    ],
    [localeCode, t],
  );

  return <DataTable data={data} columns={columns} ariaLabel={t("transactions.tableAria")} pageSize={20} />;
}
