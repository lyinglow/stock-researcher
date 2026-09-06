import React from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { formatPercent } from "../../lib/format";

export default function MarginGauge({ profitMargin }) {
  const pct = Math.max(0, (profitMargin || 0) * 100);
  const data = [{ name: "margin", value: Math.min(pct, 100), fill: "#0EA5E9" }];

  return (
    <div className="relative flex flex-col items-center" data-testid="margin-gauge">
      <RadialBarChart
        width={140}
        height={140}
        cx={70}
        cy={70}
        innerRadius={48}
        outerRadius={64}
        barSize={12}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: "#F7E9BC" }}
          dataKey="value"
          cornerRadius={8}
          isAnimationActive
          animationDuration={900}
        />
      </RadialBarChart>
      <div className="absolute inset-0 top-2 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-ink-900">{formatPercent(pct, { digits: 1 })}</span>
        <span className="text-[10px] uppercase tracking-wide text-ink-500">Profit margin</span>
      </div>
    </div>
  );
}
