"use client";

import { Fragment } from "react";
import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTranslation, type TranslationKey } from "@/lib/hooks/use-translation";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import type { DashboardFilters } from "@/lib/types";
import { COUNTRIES, DEVICES, PLATFORMS, USER_TYPES } from "@/lib/mock-data/common";

type FilterKey = keyof Pick<DashboardFilters, "platform" | "country" | "device" | "userType">;

const OPTIONS: Record<FilterKey, string[]> = {
  platform: PLATFORMS,
  country: COUNTRIES,
  device: DEVICES,
  userType: USER_TYPES,
};

const LABELS: Record<FilterKey, TranslationKey> = {
  platform: "filter.platform",
  country: "filter.country",
  device: "filter.device",
  userType: "filter.userType",
};

export function FilterBar() {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useDashboardStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
  }));

  const hasActiveFilters = (Object.keys(filters) as Array<keyof DashboardFilters>).some(
    (key) => filters[key]?.length,
  );

  return (
    <div className="flex w-full flex-wrap items-center gap-2" aria-label={t("filter.aria")}>
      <Badge variant="secondary" className="h-9 gap-1 px-3 text-sm">
        <Filter className="size-4" aria-hidden="true" /> {t("header.filters")}
      </Badge>
      {(Object.keys(OPTIONS) as FilterKey[]).map((key) => (
        <DropdownMenu key={key}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <span>{t(LABELS[key])}</span>
              {filters[key]?.length ? (
                <Badge variant="default" className="rounded-full px-2 text-xs">
                  {filters[key]?.length}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>{t(LABELS[key])}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {OPTIONS[key].map((option) => {
              const checked = filters[key]?.includes(option) ?? false;
              return (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={checked}
                  onCheckedChange={(value) => {
                    const next = new Set(filters[key]);
                    if (value) {
                      next.add(option);
                    } else {
                      next.delete(option);
                    }
                    setFilters({ [key]: Array.from(next) } as Partial<DashboardFilters>);
                  }}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
      {hasActiveFilters ? (
        <Fragment>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("filter.clear")}
          </Button>
        </Fragment>
      ) : null}
    </div>
  );
}
