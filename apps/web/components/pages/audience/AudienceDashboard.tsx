"use client";

import { useMemo, useState } from "react";

import { WidgetMenu } from "@/components/common/WidgetMenu";
import { WidgetShell } from "@/components/common/WidgetShell";
import { BarChartX } from "@/components/charts/BarChartX";
import { LineChartX } from "@/components/charts/LineChartX";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable } from "@/components/tables/DataTable";
import {
  useAudienceFollowers,
  useAudienceRealtime,
  useAudienceRetention,
} from "@/lib/hooks/use-audience-data";
import type { RetentionPoint } from "@/lib/types";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { buildCsv, downloadCsv, notifyCsvError } from "@/lib/csv";

type CohortKey = "7d" | "30d" | "90d";

const COHORT_LABEL_KEYS: Record<CohortKey, TranslationKey> = {
  "7d": "audience.cohort.7d",
  "30d": "audience.cohort.30d",
  "90d": "audience.cohort.90d",
};

const EMPTY_RETENTION: RetentionPoint[] = [];

export function AudienceDashboard() {
  const { t, locale } = useTranslation();
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";
  const [followersAsTable, setFollowersAsTable] = useState(false);
  const [retentionAsTable, setRetentionAsTable] = useState(false);

  const followersQuery = useAudienceFollowers();
  const retentionQuery = useAudienceRetention();
  const realtimeQuery = useAudienceRealtime();

  const followers = followersQuery.data?.data ?? [];
  const retention = retentionQuery.data?.data ?? EMPTY_RETENTION;
  const realtime = realtimeQuery.data?.data;
  const retentionDisplay = useMemo(
    () =>
      retention.map((item) => ({
        cohort: item.cohort_start,
        label: t(COHORT_LABEL_KEYS[item.cohort_start as CohortKey] ?? item.cohort_start),
        retention: item.retention_rate,
      })),
    [retention, t],
  );

  if (followersQuery.isLoading || retentionQuery.isLoading || realtimeQuery.isLoading) {
    return <div className="grid gap-4">{t("audience.loading")}</div>;
  }

  if (followersQuery.isError || retentionQuery.isError || realtimeQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {t("audience.error")}
      </div>
    );
  }

  const exportFollowers = () => {
    try {
      const csv = buildCsv(followers, [
        { key: "date", header: "date" },
        { key: "followers_total", header: "followers_total" },
        { key: "followers_new", header: "followers_new" },
        { key: "followers_churned", header: "followers_churned" },
      ]);
      downloadCsv("followers_trend.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportRetention = () => {
    try {
      const csv = buildCsv(retention, [
        { key: "cohort_start", header: "cohort_start" },
        { key: "retention_rate", header: "retention_rate" },
        { key: "churn_rate", header: "churn_rate" },
      ]);
      downloadCsv("retention.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("audience.kpi.active")}
          value={formatNumber(realtime?.active_users ?? 0)}
        />
        <KpiCard
          label={t("audience.kpi.retention7d")}
          value={formatPercent(retention.find((r) => r.cohort_start === "7d")?.retention_rate ?? 0)}
        />
        <KpiCard
          label={t("audience.kpi.retention30d")}
          value={formatPercent(retention.find((r) => r.cohort_start === "30d")?.retention_rate ?? 0)}
        />
        <KpiCard
          label={t("audience.kpi.churn")}
          value={formatPercent(retention.find((r) => r.cohort_start === "7d")?.churn_rate ?? 0)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <WidgetShell
          title={t("audience.followers.title")}
          actions={<WidgetMenu onDownloadCsv={exportFollowers} onToggleTable={() => setFollowersAsTable((prev) => !prev)} />}
        >
          {followersAsTable ? (
            <DataTable
              data={followers}
              columns={[
                { key: "date", header: t("audience.followers.column.date") },
                { key: "followers_total", header: t("audience.followers.column.total"), align: "right" },
                { key: "followers_new", header: t("audience.followers.column.new"), align: "right" },
                { key: "followers_churned", header: t("audience.followers.column.churned"), align: "right" },
              ]}
              ariaLabel={t("audience.followers.tableAria")}
              searchable={false}
            />
          ) : (
            <LineChartX
              data={followers}
              xKey="date"
              series={[
                { dataKey: "followers_total", label: t("audience.followers.series.total"), color: "hsl(var(--chart-1))" },
                { dataKey: "followers_new", label: t("audience.followers.series.new"), color: "hsl(var(--chart-3))" },
                { dataKey: "followers_churned", label: t("audience.followers.series.churned"), color: "hsl(var(--chart-5))" },
              ]}
              ariaLabel={t("audience.followers.chartAria")}
            />
          )}
        </WidgetShell>

        <WidgetShell
          title={t("audience.retention.title")}
          actions={<WidgetMenu onDownloadCsv={exportRetention} onToggleTable={() => setRetentionAsTable((prev) => !prev)} />}
        >
          {retentionAsTable ? (
            <DataTable
              data={retentionDisplay}
              columns={[
                { key: "label", header: t("audience.retention.column.cohort") },
                { key: "retention", header: t("audience.retention.column.retention"), align: "right" },
              ]}
              ariaLabel={t("audience.retention.tableAria")}
              searchable={false}
            />
          ) : (
            <BarChartX
              data={retentionDisplay}
              xKey="label"
              series={[{ dataKey: "retention", label: t("audience.retention.series.retention"), color: "hsl(var(--chart-4))" }]}
              ariaLabel={t("audience.retention.chartAria")}
            />
          )}
        </WidgetShell>
      </section>

      <section>
        <WidgetShell title={t("audience.realtime.title")} description={t("audience.realtime.description")}>
          <div className="text-3xl font-semibold">
            {formatNumber(realtime?.active_users ?? 0)} {t("audience.realtime.usersOnline")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("audience.realtime.lastUpdated", {
              time: realtime?.polled_at ? new Date(realtime.polled_at).toLocaleTimeString(localeCode) : "--",
            })}
          </p>
        </WidgetShell>
      </section>
    </div>
  );
}
