"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesConfig = {
  dataKey: string;
  label: string;
  color: string;
};

type BarChartXProps<TData extends Record<string, unknown>> = {
  data: TData[];
  xKey: keyof TData & string;
  series: SeriesConfig[];
  height?: number;
  onBarClick?: (payload: TData, series: SeriesConfig) => void;
  ariaLabel?: string;
};

export function BarChartX<TData extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 320,
  onBarClick,
  ariaLabel,
}: BarChartXProps<TData>) {
  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barCategoryGap={12}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} cursor={{ fill: "rgba(15, 118, 110, 0.1)" }} />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item) => (
            <Bar
              key={item.dataKey}
              dataKey={item.dataKey}
              name={item.label}
              fill={item.color}
              radius={[6, 6, 0, 0]}
              onClick={onBarClick ? (payload) => onBarClick(payload, item) : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
