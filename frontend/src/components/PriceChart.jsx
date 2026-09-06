import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "./Card";
import { formatPrice } from "../lib/format";

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-butter-200 bg-white px-3 py-2 shadow-soft">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="font-display text-base text-ink-900">
        {formatPrice(payload[0].value, currency)}
      </div>
    </div>
  );
}

export default function PriceChart({ stock }) {
  const data = useMemo(() => stock.priceHistory || [], [stock.priceHistory]);

  const ticks = useMemo(() => {
    if (data.length < 2) return [];
    const step = Math.floor(data.length / 5);
    const out = [];
    for (let i = 0; i < data.length; i += Math.max(step, 1)) out.push(data[i].date);
    return out;
  }, [data]);

  return (
    <Card testId="price-chart" delay={0.05}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-ink-900">1-year price</h2>
        <span className="text-xs text-ink-500">Daily close</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F0DA8E" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tick={{ fontSize: 11, fill: "#6B6248" }}
              axisLine={{ stroke: "#F0DA8E" }}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "#6B6248" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => formatPrice(v, stock.currency).replace(/\.00$/, "")}
            />
            <RTooltip content={<ChartTooltip currency={stock.currency} />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#priceFill)"
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
