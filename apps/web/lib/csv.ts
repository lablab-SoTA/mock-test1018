import Papa from "papaparse";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type CsvColumn<T> = {
  key: keyof T & string;
  header: string;
  transform?: (value: unknown, row: T) => unknown;
};

export function buildCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]) {
  const data = rows.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, column) => {
      const value = row[column.key];
      acc[column.header] = column.transform ? column.transform(value, row) : value;
      return acc;
    }, {}),
  );

  return Papa.unparse(data, { header: true });
}

export class CsvDownloadError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CsvDownloadError";
    if (cause instanceof Error && cause.stack) {
      this.stack = cause.stack;
    }
  }
}

export function downloadCsv(filename: string, csv: string) {
  let url: string | null = null;
  const link = document.createElement("a");
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    throw new CsvDownloadError("Failed to generate CSV download", error);
  } finally {
    if (link.parentElement) {
      document.body.removeChild(link);
    }
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}

export async function downloadCsvBundle(files: { filename: string; csv: string }[], archiveName: string) {
  try {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.filename, file.csv);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, archiveName);
  } catch (error) {
    throw new CsvDownloadError("Failed to build CSV bundle", error);
  }
}

export function notifyCsvError(error: unknown) {
  console.error(error);
  if (typeof window !== "undefined") {
    window.alert("CSV export failed. Please try again.");
  }
}
