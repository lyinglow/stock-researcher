import React from "react";
import {
  LineChart,
  Line,
  ReferenceLine,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "../../lib/format";

export default function Sparkline({ history, low, high, currency }) {
  return (
    <div className="h-32 w-full" data-testid="context-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <YAxis hide domain={[low ? low * 0.97 : "auto", high ? high * 1.03 : "auto"]} />
          <ReferenceLine
            y={high}
            stroke="#0284C7"
            strokeDasharray="4 4"
            label={{ value: `52w high ${formatPrice(high, currency)}`, position: "insideTopRight", fontSize: 10, fill: "#0284C7" }}
          />
          <ReferenceLine
            y={low}
            stroke="#94A3B8"
            strokeDasharray="4 4"
            label={{ value: `52w low ${formatPrice(low, currency)}`, position: "insideBottomRight", fontSize: 10, fill: "#6B6248" }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#0EA5E9"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
