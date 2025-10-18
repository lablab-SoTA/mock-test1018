"use client";

import { useMemo, useState } from "react";

import { WidgetMenu } from "@/components/common/WidgetMenu";
import { WidgetShell } from "@/components/common/WidgetShell";
import { BarChartX } from "@/components/charts/BarChartX";
import { LineChartX } from "@/components/charts/LineChartX";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type ColumnDefinition } from "@/components/tables/DataTable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useContentPerformance,
  useContentTop,
  useContentWatchTimeTrend,
} from "@/lib/hooks/use-content-data";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";
import type { ContentPerformanceRow, ContentTopItem, WatchTimeTrendPoint } from "@/lib/types";
import { buildCsv, downloadCsv, notifyCsvError } from "@/lib/csv";

const STATUS_LABEL_KEYS: Record<ContentPerformanceRow["status"], TranslationKey> = {
  draft: "content.status.draft",
  scheduled: "content.status.scheduled",
  published: "content.status.published",
};

const EMPTY_CONTENT: ContentPerformanceRow[] = [];
const EMPTY_TOP: ContentTopItem[] = [];
const EMPTY_TREND: WatchTimeTrendPoint[] = [];

export function ContentDashboard() {
  const { t } = useTranslation();
  const [selectedContent, setSelectedContent] = useState<ContentPerformanceRow | null>(null);
  const [topAsTable, setTopAsTable] = useState(false);
  const [watchAsTable, setWatchAsTable] = useState(false);

  const performanceQuery = useContentPerformance();
  const topQuery = useContentTop();
  const trendQuery = useContentWatchTimeTrend();

  const columns = useMemo<ColumnDefinition<ContentPerformanceRow>[]>(
    () => [
      {
        key: "title",
        header: t("content.table.title"),
        render: (row) => (
          <button type="button" className="text-left font-medium" onClick={() => setSelectedContent(row)}>
            {row.title}
          </button>
        ),
      },
      {
        key: "views",
        header: t("content.table.views"),
        align: "right",
        sortable: true,
        render: (row) => formatNumber(row.views),
      },
      {
        key: "unique_viewers",
        header: t("content.table.uniqueViewers"),
        align: "right",
        sortable: true,
        render: (row) => formatNumber(row.unique_viewers),
      },
      {
        key: "sales",
        header: t("content.table.sales"),
        align: "right",
        sortable: true,
        render: (row) => formatNumber(row.sales),
      },
      {
        key: "revenue",
        header: t("content.table.revenue"),
        align: "right",
        sortable: true,
        render: (row) => formatCurrency(row.revenue, { decimals: true }),
      },
      {
        key: "conversion_rate",
        header: t("content.table.cvr"),
        align: "right",
        sortable: true,
        render: (row) => formatPercent(row.conversion_rate),
      },
      {
        key: "avg_watch_time_sec",
        header: t("content.table.avgWatch"),
        align: "right",
        sortable: true,
        render: (row) => t("content.table.avgWatchValue", { seconds: Math.round(row.avg_watch_time_sec) }),
      },
    ],
    [setSelectedContent, t],
  );

  const performance = performanceQuery.data?.data ?? EMPTY_CONTENT;
  const topContent = topQuery.data?.data ?? EMPTY_TOP;
  const watchTimeTrend = trendQuery.data?.data ?? EMPTY_TREND;
  const totals = useMemo(() => calculateTotals(performance), [performance]);
  const statusRows = useMemo(() => buildStatusDistribution(performance), [performance]);
  const statusColumns = useMemo<ColumnDefinition<{ status: string; count: number }>[]>(
    () => [
      {
        key: "status",
        header: t("content.status.column.status"),
        render: (row) => t(STATUS_LABEL_KEYS[row.status as ContentPerformanceRow["status"]]),
      },
      {
        key: "count",
        header: t("content.status.column.count"),
        align: "right",
        render: (row) => formatNumber(row.count),
      },
    ],
    [t],
  );

  if (performanceQuery.isLoading || topQuery.isLoading || trendQuery.isLoading) {
    return <div className="grid gap-4">{t("content.loading")}</div>;
  }

  if (performanceQuery.isError || topQuery.isError || trendQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {t("content.error")}
      </div>
    );
  }

  const exportPerformance = () => {
    try {
      const csv = buildCsv(performance, [
        { key: "content_id", header: "content_id" },
        { key: "title", header: "title" },
        { key: "views", header: "views" },
        { key: "unique_viewers", header: "unique_viewers" },
        { key: "sales", header: "sales" },
        { key: "revenue", header: "revenue" },
        { key: "conversion_rate", header: "conversion_rate" },
        { key: "avg_watch_time_sec", header: "avg_watch_time_sec" },
        { key: "likes", header: "likes" },
        { key: "comments", header: "comments" },
        { key: "reposts", header: "reposts" },
        { key: "status", header: "status" },
      ]);
      downloadCsv("content_performance.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportTop = () => {
    try {
      const csv = buildCsv(topContent, [
        { key: "content_id", header: "content_id" },
        { key: "title", header: "title" },
        { key: "views", header: "views" },
        { key: "revenue", header: "revenue" },
      ]);
      downloadCsv("content_top5.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportWatchTime = () => {
    try {
      const csv = buildCsv(watchTimeTrend, [
        { key: "date", header: "date" },
        { key: "avg_watch_time_sec", header: "avg_watch_time_sec" },
      ]);
      downloadCsv("watch_time_trend.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={t("content.kpi.topRevenue")}
            value={formatCurrency(topQuery.data?.data[0]?.revenue ?? 0, { decimals: true })}
          />
          <KpiCard
            label={t("content.kpi.avgWatch")}
            value={t("content.table.avgWatchValue", { seconds: Math.round(totals.avgWatchTime) })}
            helpText={t("content.kpi.avgWatch.help")}
          />
          <KpiCard label={t("content.kpi.avgCvr")} value={formatPercent(totals.avgCvr)} />
          <KpiCard label={t("content.kpi.engagement")} value={formatPercent(totals.engagement)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <WidgetShell
            title={t("content.performance.title")}
            description={t("content.performance.description")}
            actions={<WidgetMenu onDownloadCsv={exportPerformance} />}
          >
            <DataTable
              data={performance}
              columns={columns}
              ariaLabel={t("content.performance.tableAria")}
              pageSize={15}
            />
          </WidgetShell>

          <WidgetShell
            title={t("content.top.title")}
            actions={<WidgetMenu onDownloadCsv={exportTop} onToggleTable={() => setTopAsTable((prev) => !prev)} />}
          >
            {topAsTable ? (
              <DataTable
                data={topContent}
                columns={[
                  { key: "title", header: t("content.top.column.title") },
                  { key: "revenue", header: t("content.top.column.revenue"), align: "right" },
                  { key: "views", header: t("content.top.column.views"), align: "right" },
                ]}
                ariaLabel={t("content.top.tableAria")}
                searchable={false}
              />
            ) : (
              <BarChartX
                data={topContent.map((item) => ({
                  title: item.title,
                  revenue: item.revenue,
                }))}
                xKey="title"
                series={[{ dataKey: "revenue", label: t("content.top.series.revenue"), color: "hsl(var(--chart-1))" }]}
                ariaLabel={t("content.top.chartAria")}
              />
            )}
          </WidgetShell>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <WidgetShell
            title={t("content.watch.title")}
            actions={<WidgetMenu onDownloadCsv={exportWatchTime} onToggleTable={() => setWatchAsTable((prev) => !prev)} />}
          >
            {watchAsTable ? (
              <DataTable
                data={watchTimeTrend}
                columns={[
                  { key: "date", header: t("content.watch.column.date") },
                  { key: "avg_watch_time_sec", header: t("content.watch.column.avg"), align: "right" },
                ]}
                ariaLabel={t("content.watch.tableAria")}
                searchable={false}
              />
            ) : (
              <LineChartX
                data={watchTimeTrend}
                xKey="date"
                series={[{ dataKey: "avg_watch_time_sec", label: t("content.watch.series.avg"), color: "hsl(var(--chart-2))" }]}
                ariaLabel={t("content.watch.chartAria")}
              />
            )}
          </WidgetShell>

          <WidgetShell title={t("content.status.title")}>
            <DataTable
              data={statusRows}
              columns={statusColumns}
              ariaLabel={t("content.status.tableAria")}
              pageSize={5}
              searchable={false}
            />
          </WidgetShell>
        </section>
      </div>

      <Sheet open={Boolean(selectedContent)} onOpenChange={(open) => !open && setSelectedContent(null)}>
        <SheetContent className="max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedContent?.title}</SheetTitle>
            <SheetDescription>{selectedContent?.creator_segment}</SheetDescription>
          </SheetHeader>
          {selectedContent ? (
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label={t("content.sheet.revenue")} value={formatCurrency(selectedContent.revenue, { decimals: true })} />
              <InfoRow label={t("content.sheet.sales")} value={formatNumber(selectedContent.sales)} />
              <InfoRow label={t("content.sheet.views")} value={formatNumber(selectedContent.views)} />
              <InfoRow label={t("content.sheet.cvr")} value={formatPercent(selectedContent.conversion_rate)} />
              <InfoRow
                label={t("content.sheet.avgWatch")}
                value={t("content.table.avgWatchValue", { seconds: Math.round(selectedContent.avg_watch_time_sec) })}
              />
              <InfoRow
                label={t("content.sheet.engagement")}
                value={`${formatNumber(selectedContent.likes)} ❤️ / ${formatNumber(selectedContent.comments)} 💬 / ${formatNumber(selectedContent.reposts)} 🔁`}
              />
              <InfoRow label={t("content.sheet.status")} value={t(STATUS_LABEL_KEYS[selectedContent.status])} />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function calculateTotals(rows: ContentPerformanceRow[]) {
  if (!rows.length) {
    return { avgWatchTime: 0, avgCvr: 0, engagement: 0 };
  }
  const totals = rows.reduce(
    (acc, row) => {
      acc.watch += row.avg_watch_time_sec;
      acc.cvr += row.conversion_rate;
      acc.engagement += (row.likes + row.comments + row.reposts) / Math.max(1, row.views);
      return acc;
    },
    { watch: 0, cvr: 0, engagement: 0 },
  );
  return {
    avgWatchTime: totals.watch / rows.length,
    avgCvr: totals.cvr / rows.length,
    engagement: totals.engagement / rows.length,
  };
}

function buildStatusDistribution(rows: ContentPerformanceRow[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.status, (map.get(row.status) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
