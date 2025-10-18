"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CsvColumn } from "@/lib/csv";
import { buildCsv, downloadCsv, notifyCsvError } from "@/lib/csv";
import { useTranslation } from "@/lib/hooks/use-translation";

type DownloadCsvProps<T extends Record<string, unknown>> = {
  filename: string;
  rows: T[];
  columns: CsvColumn<T>[];
  children?: React.ReactNode;
  disabled?: boolean;
};

export function DownloadCsvButton<T extends Record<string, unknown>>({ filename, rows, columns, children, disabled }: DownloadCsvProps<T>) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = useCallback(() => {
    setIsDownloading(true);
    try {
      const csv = buildCsv(rows, columns);
      downloadCsv(filename, csv);
    } catch (error) {
      notifyCsvError(error);
    } finally {
      setIsDownloading(false);
    }
  }, [rows, columns, filename]);

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={disabled || isDownloading} aria-busy={isDownloading}>
      {children ?? t("widget.downloadCsv")}
    </Button>
  );
}
