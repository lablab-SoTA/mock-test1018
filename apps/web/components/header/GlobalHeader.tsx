"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/header/DateRangePicker";
import { FilterBar } from "@/components/header/FilterBar";
import { cn } from "@/lib/utils";
import { useDashboardQuery } from "@/lib/hooks/use-dashboard-query";
import { buildCsv, downloadCsvBundle, notifyCsvError, type CsvColumn } from "@/lib/csv";
import { getJson } from "@/lib/api/client";
import {
  type RevenueBreakdownResponse,
  type RevenueSummaryResponse,
  type RevenueTopPayersResponse,
  type RevenueTransactionsResponse,
  type TransactionRow,
} from "@/lib/types";
import { useTranslation, type TranslationKey, type Locale } from "@/lib/hooks/use-translation";

const TABS = [
  { labelKey: "tab.revenue", href: "/" },
  { labelKey: "tab.acquisition", href: "/acquisition" },
  { labelKey: "tab.content", href: "/content" },
  { labelKey: "tab.audience", href: "/audience" },
] satisfies Array<{ labelKey: TranslationKey; href: string }>;

const TRANSACTION_EXPORT_COLUMNS: CsvColumn<TransactionRow>[] = [
  { key: "transaction_id", header: "transaction_id" },
  { key: "paid_at_utc", header: "paid_at_utc" },
  { key: "user_id_hash", header: "user_id_hash" },
  { key: "content_id", header: "content_id" },
  { key: "product_type", header: "product_type" },
  { key: "amount", header: "amount", transform: (value) => Number(value) },
  { key: "currency", header: "currency" },
  { key: "tax", header: "tax", transform: (value) => Number(value) },
  { key: "discount", header: "discount", transform: (value) => Number(value) },
  { key: "status", header: "status" },
  { key: "source", header: "source" },
  { key: "platform", header: "platform" },
  { key: "device", header: "device" },
  { key: "country", header: "country" },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const { queryString } = useDashboardQuery("header-export");
  const [isExporting, setIsExporting] = useState(false);
  const { t, locale, setLocale, supportedLocales, getLocaleLabel } = useTranslation();

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const tab = resolveTabValue(pathname);
      if (tab === "/") {
        await exportRevenue(queryString);
      } else if (tab === "/acquisition") {
        await exportAcquisition(queryString);
      } else if (tab === "/content") {
        await exportContent(queryString);
      } else if (tab === "/audience") {
        await exportAudience(queryString);
      }
    } catch (error) {
      notifyCsvError(error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, pathname, queryString]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 md:flex-none">
            <Tabs value={resolveTabValue(pathname)} className="w-full">
              <TabsList className="flex h-10 items-center gap-2 overflow-x-auto rounded-full bg-muted/40 p-1">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.href}
                    value={tab.href}
                    asChild
                    className={cn(
                      "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                      resolveTabValue(pathname) === tab.href
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Link href={tab.href}>{t(tab.labelKey)}</Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger className="h-10 w-full gap-2 sm:w-[150px]" aria-label={t("language.label")}>
                <Globe className="size-4" aria-hidden="true" />
                <SelectValue placeholder={t("language.label")} />
              </SelectTrigger>
              <SelectContent align="end">
                {supportedLocales.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getLocaleLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10 w-full gap-2 sm:w-auto"
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
            >
              <Download className="size-4" aria-hidden="true" /> {isExporting ? t("header.exporting") : t("header.export")}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <DateRangePicker />
          <FilterBar />
        </div>
      </div>
    </header>
  );
}

function resolveTabValue(pathname: string) {
  if (pathname === "/") return "/";
  const match = TABS.find((tab) => tab.href !== "/" && pathname.startsWith(tab.href));
  return match?.href ?? "/";
}

async function exportRevenue(queryString: string) {
  const [summary, breakdown, transactions, topPayers] = await Promise.all([
    getJson<RevenueSummaryResponse>(`/api/revenue/summary?${queryString}`),
    getJson<RevenueBreakdownResponse>(`/api/revenue/breakdown?${queryString}`),
    getJson<RevenueTransactionsResponse>(`/api/revenue/transactions?${queryString}`),
    getJson<RevenueTopPayersResponse>(`/api/revenue/top-payers?${queryString}`),
  ]);

  const files = [
    {
      filename: "revenue_summary.csv",
      csv: buildCsv([summary.data], [
        { key: "gross", header: "gross" },
        { key: "net", header: "net" },
        { key: "orders", header: "orders" },
        { key: "paying_users", header: "paying_users" },
        { key: "arppu", header: "arppu" },
        { key: "payment_rate", header: "payment_rate" },
        { key: "churn_rate", header: "churn_rate" },
        { key: "retention_rate", header: "retention_rate" },
      ]),
    },
    {
      filename: "revenue_breakdown.csv",
      csv: buildCsv(breakdown.data, [
        { key: "label", header: "product_type" },
        { key: "revenue", header: "revenue" },
        { key: "share", header: "share" },
      ]),
    },
    {
      filename: "transactions.csv",
      csv: buildCsv(transactions.rows, TRANSACTION_EXPORT_COLUMNS),
    },
    {
      filename: "top_payers.csv",
      csv: buildCsv(topPayers.data, [
        { key: "user_id_hash", header: "user_id_hash" },
        { key: "total_revenue", header: "total_revenue" },
        { key: "orders", header: "orders" },
        { key: "avg_order_value", header: "avg_order_value" },
        { key: "last_purchase_utc", header: "last_purchase_utc" },
      ]),
    },
  ];

  await downloadCsvBundle(files, "revenue_tab.zip");
}

async function exportAcquisition(queryString: string) {
  const [funnel, sources, platform, mix] = await Promise.all([
    getJson<{ data: Array<{ label: string; volume: number; conversion_rate: number }> }>(`/api/acquisition/funnel?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/acquisition/sources?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/acquisition/platform-arpu?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/acquisition/mix?${queryString}`),
  ]);

  const files = [
    {
      filename: "funnel.csv",
      csv: buildCsv(
        funnel.data.map((stage) => ({
          stage: stage.label,
          volume: stage.volume,
          conversion_rate: stage.conversion_rate,
        })),
        [
          { key: "stage", header: "stage" },
          { key: "volume", header: "volume" },
          { key: "conversion_rate", header: "conversion_rate" },
        ],
      ),
    },
    { filename: "sources.csv", csv: buildCsv(sources.data, Object.keys(sources.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "platform_arpu.csv", csv: buildCsv(platform.data, Object.keys(platform.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "traffic_mix.csv", csv: buildCsv(mix.data, Object.keys(mix.data[0] ?? {}).map((key) => ({ key, header: key }))) },
  ];

  await downloadCsvBundle(files, "acquisition_tab.zip");
}

async function exportContent(queryString: string) {
  const [performance, top, watch] = await Promise.all([
    getJson<{ data: Record<string, unknown>[] }>(`/api/content/performance?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/content/top5?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/content/watch-time-trend?${queryString}`),
  ]);

  const files = [
    { filename: "content_performance.csv", csv: buildCsv(performance.data, Object.keys(performance.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "content_top5.csv", csv: buildCsv(top.data, Object.keys(top.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "watch_time_trend.csv", csv: buildCsv(watch.data, Object.keys(watch.data[0] ?? {}).map((key) => ({ key, header: key }))) },
  ];

  await downloadCsvBundle(files, "content_tab.zip");
}

async function exportAudience(queryString: string) {
  const [followers, retention, realtime] = await Promise.all([
    getJson<{ data: Record<string, unknown>[] }>(`/api/audience/followers?${queryString}`),
    getJson<{ data: Record<string, unknown>[] }>(`/api/audience/retention?${queryString}`),
    getJson<{ data: Record<string, unknown> }>(`/api/audience/realtime?${queryString}`),
  ]);

  const files = [
    { filename: "followers_trend.csv", csv: buildCsv(followers.data, Object.keys(followers.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "retention.csv", csv: buildCsv(retention.data, Object.keys(retention.data[0] ?? {}).map((key) => ({ key, header: key }))) },
    { filename: "realtime.csv", csv: buildCsv([realtime.data], Object.keys(realtime.data ?? {}).map((key) => ({ key, header: key }))) },
  ];

  await downloadCsvBundle(files, "audience_tab.zip");
}
