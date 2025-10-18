"use client";

import { useCallback } from "react";

import { translate, type TranslationKey, getLocaleLabel, supportedLocales } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import type { Locale } from "@/lib/types";

export function useTranslation() {
  const locale = useDashboardStore((state) => state.locale);
  const setLocale = useDashboardStore((state) => state.setLocale);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  return {
    t,
    locale,
    setLocale,
    supportedLocales,
    getLocaleLabel,
  } as const;
}

export type { TranslationKey, Locale };
