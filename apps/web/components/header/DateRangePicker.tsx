"use client";

import { useMemo } from "react";
import { addDays, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import type { CompareMode, DateRangePreset, GroupByGranularity } from "@/lib/types";

type PresetOption = {
  id: DateRangePreset;
  labelKey: TranslationKey;
};

const PRESETS: PresetOption[] = [
  { id: "today", labelKey: "date.preset.today" },
  { id: "yesterday", labelKey: "date.preset.yesterday" },
  { id: "last7", labelKey: "date.preset.last7" },
  { id: "last30", labelKey: "date.preset.last30" },
  { id: "thisMonth", labelKey: "date.preset.thisMonth" },
  { id: "prevMonth", labelKey: "date.preset.prevMonth" },
  { id: "custom", labelKey: "date.preset.custom" },
];

const GROUP_BY_OPTIONS: { labelKey: TranslationKey; value: GroupByGranularity }[] = [
  { labelKey: "date.groupBy.day", value: "day" },
  { labelKey: "date.groupBy.week", value: "week" },
  { labelKey: "date.groupBy.month", value: "month" },
];

const COMPARE_OPTIONS: { labelKey: TranslationKey; value: CompareMode }[] = [
  { labelKey: "date.compare.none", value: "none" },
  { labelKey: "date.compare.previous", value: "previous" },
  { labelKey: "date.compare.yoy", value: "yoy" },
];

export function DateRangePicker() {
  const { t, locale } = useTranslation();
  const {
    range,
    preset,
    compare,
    groupBy,
    setRange,
    setPreset,
    setCompare,
    setGroupBy,
  } = useDashboardStore((state) => ({
    range: state.range,
    preset: state.preset,
    compare: state.compare,
    groupBy: state.groupBy,
    setRange: state.setRange,
    setPreset: state.setPreset,
    setCompare: state.setCompare,
    setGroupBy: state.setGroupBy,
  }));

  const selected = useMemo(
    () => ({
      from: parseISO(range.start),
      to: parseISO(range.end),
    }),
    [range.end, range.start],
  );

  const localeCode = locale === "ja" ? "ja-JP" : "en-US";

  const label = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(localeCode, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const from = formatter.format(parseISO(range.start));
    const to = formatter.format(parseISO(range.end));
    if (from === to) return from;
    return `${from} – ${to}`;
  }, [localeCode, range.end, range.start]);

  const handlePreset = (option: PresetOption) => {
    setPreset(option.id);
    if (option.id !== "custom") {
      setCompare(compare === "none" ? "previous" : compare);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="min-w-[240px] justify-start gap-2"
          aria-label={t("date.selectedRange", { range: label })}
        >
          <span className="text-left">
            <span className="block text-xs text-muted-foreground">{t("date.range")}</span>
            <span className="font-medium text-sm">{label}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[680px] max-w-full p-4" sideOffset={12}>
        <div className="grid grid-cols-[180px_1fr] gap-4">
          <div className="flex flex-col gap-2" role="list">
            {PRESETS.map((option) => (
              <Button
                key={option.id}
                variant={option.id === preset ? "default" : "ghost"}
                className="justify-start"
                onClick={() => handlePreset(option)}
                role="listitem"
              >
                <span>{t(option.labelKey)}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={selected}
              defaultMonth={selected.from}
              onSelect={(nextRange) => {
                if (!nextRange?.from) return;
                const from = nextRange.from;
                const to = nextRange.to ?? addDays(nextRange.from, 6);
                setRange({ start: from.toISOString(), end: to.toISOString() });
                setPreset("custom");
              }}
              initialFocus
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("date.compare")}</p>
                <Select value={compare} onValueChange={(value) => setCompare(value as CompareMode)}>
                  <SelectTrigger className="h-9 w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("date.groupBy")}</p>
                <div className="flex rounded-full border p-1" role="radiogroup" aria-label={t("date.groupBy.aria")}>
                  {GROUP_BY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        option.value === groupBy ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                      onClick={() => setGroupBy(option.value)}
                      aria-pressed={option.value === groupBy}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
