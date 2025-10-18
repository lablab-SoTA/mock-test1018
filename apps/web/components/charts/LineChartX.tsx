"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LineSeriesConfig = {
  dataKey: string;
  label: string;
  color: string;
  strokeWidth?: number;
};

type LineChartXProps<TData extends Record<string, unknown>> = {
  data: TData[];
  xKey: keyof TData & string;
  series: LineSeriesConfig[];
  height?: number;
  ariaLabel?: string;
};

export function LineChartX<TData extends Record<string, unknown>>({ data, xKey, series, height = 320, ariaLabel }: LineChartXProps<TData>) {
  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} cursor={{ stroke: "rgba(59,130,246,0.4)" }} />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.label}
              stroke={item.color}
              strokeWidth={item.strokeWidth ?? 2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
