const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decimalCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number, options?: { compact?: boolean; decimals?: boolean }) {
  if (!Number.isFinite(value)) return "-";
  if (options?.compact) {
    return formatCompact(value, { style: "currency" });
  }
  if (options?.decimals) {
    return decimalCurrencyFormatter.format(value);
  }
  return currencyFormatter.format(value);
}

export function formatNumber(value: number, options?: { compact?: boolean; maximumFractionDigits?: number }) {
  if (!Number.isFinite(value)) return "-";
  if (options?.compact) {
    return formatCompact(value, {
      maximumFractionDigits: options.maximumFractionDigits ?? 1,
      style: "decimal",
    });
  }
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  });
  return formatter.format(value);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  return percentFormatter.format(value);
}

function formatCompact(
  value: number,
  options: {
    style: "currency" | "decimal";
    maximumFractionDigits?: number;
  },
) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: options.style,
    currency: options.style === "currency" ? "USD" : undefined,
    notation: "compact",
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
  });
  return formatter.format(value);
}
