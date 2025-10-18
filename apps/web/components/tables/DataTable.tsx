"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/use-translation";

export type ColumnDefinition<T> = {
  key: keyof T & string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
};

type SortState<T> = {
  key: keyof T & string;
  direction: "asc" | "desc";
};

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDefinition<T>[];
  pageSize?: number;
  searchable?: boolean;
  ariaLabel?: string;
};

export function DataTable<T extends Record<string, unknown>>({ data, columns, pageSize = 15, searchable = true, ariaLabel }: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [sortState, setSortState] = useState<SortState<T> | null>(null);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        typeof value === "string" ? value.toLowerCase().includes(term) : String(value).toLowerCase().includes(term),
      ),
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortState) return filteredData;
    const column = sortState.key;
    return [...filteredData].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortState.direction === "asc" ? valueA - valueB : valueB - valueA;
      }
      return sortState.direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  }, [filteredData, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedData = sortedData.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const handleSort = (column: ColumnDefinition<T>) => {
    if (!column.sortable) return;
    setPage(0);
    setSortState((prev) => {
      if (!prev || prev.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }
      return null;
    });
  };

  return (
    <div className="flex flex-col gap-3" aria-label={ariaLabel}>
      {searchable ? (
        <Input
          placeholder={t("table.searchPlaceholder")}
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full select-text border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-3 py-2 text-left font-medium text-muted-foreground", column.align === "right" && "text-right", column.align === "center" && "text-center")}
                >
                  <button
                    type="button"
                    className={cn("flex items-center gap-1", column.sortable ? "cursor-pointer" : "cursor-default")}
                    onClick={() => handleSort(column)}
                    disabled={!column.sortable}
                    aria-label={column.sortable ? t("table.sortAria", { column: column.header }) : undefined}
                  >
                    <span>{column.header}</span>
                    {sortState?.key === column.key ? (
                      <span aria-hidden className="text-xs">{sortState.direction === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-3 py-2", column.align === "right" && "text-right", column.align === "center" && "text-center")}
                  >
                    {column.render ? column.render(row) : formatCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("table.showing", { count: paginatedData.length, total: sortedData.length })}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={currentPage === 0}>
            {t("table.previous")}
          </Button>
          <span>{t("table.page", { current: currentPage + 1, total: totalPages })}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            {t("table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCell(value: unknown) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? "-");
}
