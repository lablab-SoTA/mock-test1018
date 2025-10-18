"use client";

import { ReactNode, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/hooks/use-translation";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  helpText?: string;
  trend?: "up" | "down" | "flat";
  trendTarget?: string;
  footer?: ReactNode;
};

export function KpiCard({ label, value, delta, deltaLabel, helpText, trendTarget, footer }: KpiCardProps) {
  const { t, locale } = useTranslation();
  const trend = resolveTrend(delta);
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(localeCode, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
    [localeCode],
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {label}
          {helpText ? (
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                    aria-label={t("kpi.definitionFor", { label })}
                  >
                    <Info className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                  {helpText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold">{value}</div>
        {showDelta ? (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "flex items-center rounded-full px-2 py-1 font-medium",
                trend === "up" && "bg-emerald-500/10 text-emerald-500",
                trend === "down" && "bg-destructive/10 text-destructive",
                trend === "flat" && "bg-muted text-muted-foreground",
              )}
            >
              {trend === "up" && <ArrowUpRight className="mr-1 size-3" aria-hidden="true" />}
              {trend === "down" && <ArrowDownRight className="mr-1 size-3" aria-hidden="true" />}
              {percentFormatter.format(delta ?? 0)}
            </span>
            <span className="text-muted-foreground">
              {deltaLabel ??
                (trend === "up"
                  ? t("kpi.delta.defaultUp")
                  : trend === "down"
                    ? t("kpi.delta.defaultDown")
                    : t("kpi.delta.flat"))}
            </span>
            {trendTarget ? <span className="text-muted-foreground">· {trendTarget}</span> : null}
          </div>
        ) : null}
        {footer ? <div className="pt-2 text-xs text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

function resolveTrend(delta?: number | null): "up" | "down" | "flat" {
  if (typeof delta !== "number" || Number.isNaN(delta) || !Number.isFinite(delta)) {
    return "flat";
  }
  if (delta > 0.001) return "up";
  if (delta < -0.001) return "down";
  return "flat";
}
