"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ApplicationsChart({
  data,
}: {
  data: Array<{ label: string; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--color-border)"
          strokeDasharray="0"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, (dataMax: number) => Math.max(2, dataMax)]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--color-brand-50)" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontSize: 13,
            color: "var(--color-ink)",
          }}
          labelStyle={{ color: "var(--color-ink-soft)" }}
        />
        <Bar
          dataKey="total"
          name="Pengajuan"
          fill="var(--color-brand-500)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
