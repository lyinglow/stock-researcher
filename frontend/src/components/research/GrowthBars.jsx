import React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList, ResponsiveContainer } from "recharts";
import { formatPercent } from "../../lib/format";

export default function GrowthBars({ revenueGrowth, earningsGrowth }) {
  const data = [
    { name: "Revenue", value: (revenueGrowth || 0) * 100 },
    { name: "Earnings", value: (earningsGrowth || 0) * 100 },
  ];

  return (
    <div className="h-[140px] w-full" data-testid="growth-bars">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 44, left: 0, bottom: 10 }}
        >
          <XAxis type="number" hide domain={[(min) => Math.min(0, min), (max) => Math.max(max * 1.35, 5)]} />

          <YAxis
            type="category"
            dataKey="name"
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#443C27" }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18} isAnimationActive animationDuration={900}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.value >= 0 ? "#38BDF8" : "#FB7185"} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => formatPercent(v, { signed: true, digits: 0 })}
              style={{ fontSize: 12, fill: "#211D12", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
