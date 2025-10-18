"use client";

import { useMemo, useState } from "react";

import { WidgetMenu } from "@/components/common/WidgetMenu";
import { WidgetShell } from "@/components/common/WidgetShell";
import { BarChartX } from "@/components/charts/BarChartX";
import { LineChartX } from "@/components/charts/LineChartX";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type ColumnDefinition } from "@/components/tables/DataTable";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import {
  useAcquisitionFunnel,
  useAcquisitionMix,
  useAcquisitionPlatformArpu,
  useAcquisitionSources,
} from "@/lib/hooks/use-acquisition-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";
import type { FunnelStage, SourcePerformance } from "@/lib/types";
import { buildCsv, downloadCsv, notifyCsvError } from "@/lib/csv";

type FunnelStageId = FunnelStage["id"];

const FUNNEL_STAGE_KEYS: Record<FunnelStageId, TranslationKey> = {
  visit: "acquisition.funnel.stage.visit",
  free_view: "acquisition.funnel.stage.freeView",
  first_purchase: "acquisition.funnel.stage.purchase",
};

const EMPTY_FUNNEL: FunnelStage[] = [];

export function AcquisitionDashboard() {
  const { t } = useTranslation();
  const [activeStage, setActiveStage] = useState<FunnelStageId | null>(null);
  const [funnelAsTable, setFunnelAsTable] = useState(false);
  const [platformAsTable, setPlatformAsTable] = useState(false);
  const [mixAsTable, setMixAsTable] = useState(false);

  const funnelQuery = useAcquisitionFunnel();
  const sourcesQuery = useAcquisitionSources();
  const platformQuery = useAcquisitionPlatformArpu();
  const mixQuery = useAcquisitionMix();

  const funnelData = funnelQuery.data?.data ?? EMPTY_FUNNEL;
  const metrics = (funnelQuery.data?.meta as { metrics?: Record<string, number> } | undefined)?.metrics;

  const funnelDisplayData = useMemo(
    () =>
      funnelData.map((stage) => ({
        id: stage.id,
        label: getFunnelStageLabelById(t, stage.id, stage.label),
        volume: stage.volume,
        cvr: stage.conversion_rate,
      })),
    [funnelData, t],
  );

  const filteredSources = useMemo(() => {
    if (!sourcesQuery.data) return [];
    const allSources = sourcesQuery.data.data;
    if (!activeStage || activeStage === "visit") return allSources;
    if (activeStage === "free_view") {
      return allSources.filter((row) => row.free_views > 0);
    }
    return allSources.filter((row) => row.first_purchases > 0);
  }, [sourcesQuery.data, activeStage]);

  const sourceColumns = useMemo<ColumnDefinition<SourcePerformance>[]>(
    () => [
      { key: "source", header: t("acquisition.sources.column.source"), sortable: true },
      {
        key: "visits",
        header: t("acquisition.sources.column.visits"),
        sortable: true,
        align: "right",
        render: (row) => formatNumber(row.visits),
      },
      {
        key: "free_views",
        header: t("acquisition.sources.column.freeViews"),
        sortable: true,
        align: "right",
        render: (row) => formatNumber(row.free_views),
      },
      {
        key: "first_purchases",
        header: t("acquisition.sources.column.purchases"),
        sortable: true,
        align: "right",
        render: (row) => formatNumber(row.first_purchases),
      },
      {
        key: "conversion_rate",
        header: t("acquisition.sources.column.cvr"),
        sortable: true,
        align: "right",
        render: (row) => formatPercent(row.conversion_rate),
      },
      {
        key: "arpu",
        header: t("acquisition.sources.column.arpu"),
        sortable: true,
        align: "right",
        render: (row) => formatCurrency(row.arpu, { decimals: true }),
      },
      {
        key: "revenue",
        header: t("acquisition.sources.column.revenue"),
        sortable: true,
        align: "right",
        render: (row) => formatCurrency(row.revenue, { decimals: true }),
      },
    ],
    [t],
  );

  const exportFunnel = () => {
    try {
      const rows = funnelData.map((stage) => ({
        stage: stage.label,
        volume: stage.volume,
        conversion_rate: stage.conversion_rate,
      }));
      const csv = buildCsv(rows, [
        { key: "stage", header: "stage" },
        { key: "volume", header: "volume" },
        { key: "conversion_rate", header: "conversion_rate" },
      ]);
      downloadCsv("acquisition_funnel.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportSources = () => {
    try {
      const csv = buildCsv(filteredSources, [
        { key: "source", header: "source" },
        { key: "visits", header: "visits" },
        { key: "free_views", header: "free_views" },
        { key: "first_purchases", header: "first_purchases" },
        { key: "conversion_rate", header: "conversion_rate" },
        { key: "arpu", header: "arpu" },
        { key: "revenue", header: "revenue" },
      ]);
      downloadCsv("sources_performance.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportPlatform = () => {
    try {
      const csv = buildCsv(platformQuery.data?.data ?? [], [
        { key: "platform", header: "platform" },
        { key: "arpu", header: "arpu" },
        { key: "revenue", header: "revenue" },
      ]);
      downloadCsv("platform_arpu.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  const exportMix = () => {
    try {
      const csv = buildCsv(mixQuery.data?.data ?? [], [
        { key: "date", header: "date" },
        { key: "external", header: "external" },
        { key: "internal", header: "internal" },
        { key: "direct", header: "direct" },
      ]);
      downloadCsv("traffic_mix.csv", csv);
    } catch (error) {
      notifyCsvError(error);
    }
  };

  if (funnelQuery.isLoading || sourcesQuery.isLoading || platformQuery.isLoading || mixQuery.isLoading) {
    return <div className="grid gap-4">{t("acquisition.loading")}</div>;
  }

  if (funnelQuery.isError || sourcesQuery.isError || platformQuery.isError || mixQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {t("acquisition.error")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("acquisition.kpi.visitToView")}
          value={formatPercent(funnelData[1]?.conversion_rate ?? 0)}
          helpText={t("acquisition.kpi.visitToView.help")}
        />
        <KpiCard
          label={t("acquisition.kpi.viewToPurchase")}
          value={formatPercent(funnelData[2]?.conversion_rate ?? 0)}
          helpText={t("acquisition.kpi.viewToPurchase.help")}
        />
        <KpiCard
          label={t("acquisition.kpi.externalShare")}
          value={metrics ? formatPercent(metrics.external_share ?? 0) : "-"}
          helpText={t("acquisition.kpi.externalShare.help")}
        />
        <KpiCard
          label={t("acquisition.kpi.avgTime")}
          value={metrics ? t("acquisition.kpi.avgTime.value", { hours: Math.round(metrics.avg_time_to_first_purchase_hours ?? 0) }) : "-"}
          helpText={t("acquisition.kpi.avgTime.help")}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <WidgetShell
          title={t("acquisition.funnel.title")}
          description={t("acquisition.funnel.description")}
          actions={
            <WidgetMenu onDownloadCsv={exportFunnel} onToggleTable={() => setFunnelAsTable((prev) => !prev)} />
          }
        >
          {funnelAsTable ? (
            <DataTable
              data={funnelDisplayData}
              columns={[
                { key: "label", header: t("acquisition.funnel.column.stage") },
                { key: "volume", header: t("acquisition.funnel.column.volume"), align: "right" },
                { key: "cvr", header: t("acquisition.funnel.column.cvr"), align: "right" },
              ]}
              ariaLabel={t("acquisition.funnel.tableAria")}
              searchable={false}
            />
          ) : (
            <BarChartX
              data={funnelDisplayData}
              xKey="label"
              series={[{ dataKey: "volume", label: t("acquisition.funnel.series.users"), color: "hsl(var(--chart-2))" }]}
              onBarClick={(payload) => {
                const dataPoint = payload as (typeof funnelDisplayData)[number];
                const stageId = dataPoint.id as FunnelStageId;
                setActiveStage((prev) => (prev === stageId ? null : stageId));
              }}
              ariaLabel={t("acquisition.funnel.chartAria")}
            />
          )}
        </WidgetShell>

        <WidgetShell
          title={t("acquisition.platform.title")}
          actions={
            <WidgetMenu onDownloadCsv={exportPlatform} onToggleTable={() => setPlatformAsTable((prev) => !prev)} />
          }
        >
          {platformAsTable ? (
            <DataTable
              data={platformQuery.data?.data ?? []}
              columns={[
                { key: "platform", header: t("acquisition.platform.column.platform") },
                { key: "arpu", header: t("acquisition.platform.column.arpu"), align: "right" },
                { key: "revenue", header: t("acquisition.platform.column.revenue"), align: "right" },
              ]}
              ariaLabel={t("acquisition.platform.tableAria")}
              searchable={false}
            />
          ) : (
            <BarChartX
              data={platformQuery.data?.data ?? []}
              xKey="platform"
              series={[{ dataKey: "arpu", label: t("acquisition.platform.series.arpu"), color: "hsl(var(--chart-3))" }]}
              ariaLabel={t("acquisition.platform.chartAria")}
            />
          )}
        </WidgetShell>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <WidgetShell
          title={t("acquisition.sources.title")}
          description={
            activeStage
              ? t("acquisition.sources.descriptionFocused", {
                  stage: getFunnelStageLabelById(t, activeStage),
                })
              : t("acquisition.sources.description")
          }
          actions={<WidgetMenu onDownloadCsv={exportSources} />}
        >
          <DataTable data={filteredSources} columns={sourceColumns} ariaLabel={t("acquisition.sources.tableAria")} pageSize={15} />
        </WidgetShell>

        <WidgetShell
          title={t("acquisition.mix.title")}
          actions={<WidgetMenu onDownloadCsv={exportMix} onToggleTable={() => setMixAsTable((prev) => !prev)} />}
        >
          {mixAsTable ? (
            <DataTable
              data={mixQuery.data?.data ?? []}
              columns={[
                { key: "date", header: t("acquisition.mix.column.date") },
                { key: "external", header: t("acquisition.mix.column.external"), align: "right" },
                { key: "internal", header: t("acquisition.mix.column.internal"), align: "right" },
                { key: "direct", header: t("acquisition.mix.column.direct"), align: "right" },
              ]}
              ariaLabel={t("acquisition.mix.tableAria")}
              searchable={false}
            />
          ) : (
            <LineChartX
              data={mixQuery.data?.data ?? []}
              xKey="date"
              series={[
                { dataKey: "external", label: t("acquisition.mix.series.external"), color: "hsl(var(--chart-1))" },
                { dataKey: "internal", label: t("acquisition.mix.series.internal"), color: "hsl(var(--chart-4))" },
                { dataKey: "direct", label: t("acquisition.mix.series.direct"), color: "hsl(var(--chart-5))" },
              ]}
              ariaLabel={t("acquisition.mix.chartAria")}
            />
          )}
        </WidgetShell>
      </section>
    </div>
  );
}

function getFunnelStageLabelById(
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  stageId: FunnelStageId,
  fallback?: string,
) {
  const key = FUNNEL_STAGE_KEYS[stageId];
  return key ? t(key) : fallback ?? stageId;
}
