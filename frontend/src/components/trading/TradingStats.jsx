import React from "react";
import Card from "../Card";
import { formatPrice, formatPercent } from "../../lib/format";

function Stat({ label, value, tone }) {
  const toneClass =
    tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-600" : "text-ink-900";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      <span className={`font-display text-xl ${toneClass}`}>{value}</span>
    </div>
  );
}

export default function TradingStats({ signal }) {
  const bt = signal.backtest || {};
  const isBullish = signal.currentTrend === "bullish";

  return (
    <Card testId="trading-stats" className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
      <Stat
        label="Trend"
        value={isBullish ? "Bullish" : "Bearish"}
        tone={isBullish ? "good" : "bad"}
      />
      <Stat label="Stop loss" value={formatPrice(signal.stopLoss)} />
      <Stat
        label="Win rate"
        value={bt.winRatePct != null ? formatPercent(bt.winRatePct) : "—"}
      />
      <Stat
        label="Return"
        value={formatPercent(bt.returnPct, { signed: true })}
        tone={bt.returnPct >= 0 ? "good" : "bad"}
      />
      <Stat label="Max drawdown" value={formatPercent(bt.maxDrawdownPct)} tone="bad" />
      <Stat label="Open position" value={bt.openPosition || "None"} />
    </Card>
  );
}
