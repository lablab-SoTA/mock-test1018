"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieSlice = {
  label: string;
  value: number;
  color: string;
  id?: string;
};

type PieChartXProps = {
  data: PieSlice[];
  height?: number;
  onSliceClick?: (slice: PieSlice) => void;
  ariaLabel?: string;
};

export function PieChartX({ data, height = 320, onSliceClick, ariaLabel }: PieChartXProps) {
  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={60}
            paddingAngle={4}
            onClick={onSliceClick ? (_, index) => onSliceClick(data[index]) : undefined}
          >
            {data.map((entry) => (
              <Cell key={entry.id ?? entry.label} fill={entry.color} aria-label={`${entry.label} ${entry.value}`} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, label: string) => [`${value.toLocaleString()}`, label]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
