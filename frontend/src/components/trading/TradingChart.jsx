import React, { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../Card";
import { formatPrice } from "../../lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const close = payload.find((p) => p.dataKey === "close")?.value;
  const trendLine = payload.find((p) => p.dataKey === "trendLine")?.value;
  return (
    <div className="rounded-lg border border-butter-200 bg-white px-3 py-2 shadow-soft">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="font-display text-base text-ink-900">{formatPrice(close)}</div>
      {trendLine != null && (
        <div className="text-[11px] text-ink-500">Stop {formatPrice(trendLine)}</div>
      )}
    </div>
  );
}

function SignalDot({ cx, cy, payload }) {
  if (!payload.signal) return null;
  const isBuy = payload.signal === "BUY";
  return (
    <svg x={cx - 6} y={cy - 6} width={12} height={12} viewBox="0 0 12 12">
      <polygon
        points={isBuy ? "6,0 12,12 0,12" : "0,0 12,0 6,12"}
        fill={isBuy ? "#10B981" : "#E11D48"}
        stroke="white"
        strokeWidth={1}
      />
    </svg>
  );
}

export default function TradingChart({ signal }) {
  const data = useMemo(() => {
    const signalByDate = {};
    (signal.signals || []).forEach((s) => {
      signalByDate[s.date] = s.type;
    });
    return (signal.bars || [])
      .filter((b) => b.trendLine !== null)
      .map((b) => ({ ...b, signal: signalByDate[b.date] || null }));
  }, [signal]);

  const ticks = useMemo(() => {
    if (data.length < 2) return [];
    const step = Math.floor(data.length / 6);
    const out = [];
    for (let i = 0; i < data.length; i += Math.max(step, 1)) out.push(data[i].date);
    return out;
  }, [data]);

  const trendColor = signal.currentTrend === "bullish" ? "#10B981" : "#E11D48";

  if (data.length === 0) return null;

  return (
    <Card testId="trading-chart" delay={0.05}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-ink-900">Price & trend</h2>
        <span className="text-xs text-ink-500">Daily, ATR(14), Medium noise suppression</span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => formatPrice(v).replace(/\.00$/, "")}
            />
            <RTooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={<SignalDot />}
              isAnimationActive
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="trendLine"
              stroke={trendColor}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-sky-500" /> Price
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3" style={{ backgroundColor: trendColor }} /> Trend / stop loss
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-emerald-500" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} /> Buy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-rose-600" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} /> Sell
        </span>
      </div>
    </Card>
  );
}
