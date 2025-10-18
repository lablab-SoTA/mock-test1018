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
import { buildCsv, downloadCsvBundle, notifyCsvError } from "@/lib/csv";
import { getJson } from "@/lib/api/client";
import { useTranslation, type TranslationKey, type Locale } from "@/lib/hooks/use-translation";

const TABS = [
  { labelKey: "tab.revenue", href: "/" },
  { labelKey: "tab.acquisition", href: "/acquisition" },
  { labelKey: "tab.content", href: "/content" },
  { labelKey: "tab.audience", href: "/audience" },
] satisfies Array<{ labelKey: TranslationKey; href: string }>;

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
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[240px]">
            <Tabs value={resolveTabValue(pathname)} className="w-full">
              <TabsList className="flex h-10 flex-wrap justify-start gap-2 bg-transparent p-0">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.href}
                    value={tab.href}
                    asChild
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium",
                      resolveTabValue(pathname) === tab.href
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent bg-secondary text-secondary-foreground hover:border-border",
                    )}
                  >
                    <Link href={tab.href}>{t(tab.labelKey)}</Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger className="h-10 w-[150px] gap-2" aria-label={t("language.label")}>
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
            <Button variant="outline" className="h-10 gap-2" onClick={handleExport} disabled={isExporting} aria-busy={isExporting}>
              <Download className="size-4" aria-hidden="true" /> {isExporting ? t("header.exporting") : t("header.export")}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
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
  const [summary, breakdown, transactions] = await Promise.all([
    getJson<{ data: { gross: number; net: number; orders: number; paying_users: number; arppu: number; churn_rate: number } }>(`/api/revenue/summary?${queryString}`),
    getJson<{ data: Array<{ label: string; revenue: number; share: number }> }>(`/api/revenue/breakdown?${queryString}`),
    getJson<{ rows: Record<string, unknown>[] }>(`/api/revenue/transactions?${queryString}`),
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
        { key: "churn_rate", header: "churn_rate" },
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
      csv: buildCsv(transactions.rows, Object.keys(transactions.rows[0] ?? {}).map((key) => ({ key, header: key }))),
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
