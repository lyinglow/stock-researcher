import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import Card from "./Card";
import Tooltip from "./Tooltip";
import { sectorIcon } from "./sectorIcons";
import {
  formatPrice,
  formatPercent,
  formatMarketCap,
  capTier,
  capSliderPosition,
} from "../lib/format";

const CAP_LABELS = ["Micro", "Small", "Mid", "Large", "Mega"];

function Range52Week({ low, high, price, currency }) {
  const pos = high > low ? ((price - low) / (high - low)) * 100 : 50;
  const clamped = Math.min(100, Math.max(0, pos));
  return (
    <div data-testid="week52-range">
      <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <span>52-week range</span>
        <Tooltip label="The lowest and highest closing price this stock has traded at over the last year.">
          <Info size={12} className="cursor-help text-ink-500/70" />
        </Tooltip>
      </div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-sky-100 via-sky-200 to-sky-300">
        <motion.div
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${clamped}%`, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full
            border-2 border-white bg-sky-500 shadow-soft"
        />
      </div>
      <div className="mt-1.5 flex justify-between font-display text-sm text-ink-700">
        <span>{formatPrice(low, currency)}</span>
        <span>{formatPrice(high, currency)}</span>
      </div>
    </div>
  );
}

function MarketCapSlider({ marketCap, currency }) {
  const pos = capSliderPosition(marketCap);
  const tier = capTier(marketCap);
  return (
    <div data-testid="market-cap-slider">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          <span>Market cap</span>
          <Tooltip label="Total value of all shares outstanding. Where this company sits from Micro to Mega cap.">
            <Info size={12} className="cursor-help text-ink-500/70" />
          </Tooltip>
        </div>
        <span className="font-display text-lg text-ink-900">
          {formatMarketCap(marketCap, currency)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-butter-200">
        <motion.div
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${pos}%`, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full
            border-2 border-white bg-sky-500 shadow-soft"
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-500">
        {CAP_LABELS.map((label) => (
          <span key={label} className={label === tier.label ? "font-bold text-sky-600" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function KeyDataPanel({ stock }) {
  const isUp = (stock.change ?? 0) >= 0;
  const Icon = sectorIcon(stock.sector);

  return (
    <Card testId="key-data-panel" className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col justify-center gap-2">
        <div className="flex items-baseline gap-3">
          <h1
            className="font-display text-5xl font-semibold tracking-tight text-ink-900"
            data-testid="stock-price"
          >
            {formatPrice(stock.price, stock.currency)}
          </h1>
        </div>
        <div
          className={`flex items-center gap-1 font-display text-lg ${
            isUp ? "text-emerald-600" : "text-rose-600"
          }`}
          data-testid="stock-change"
        >
          {isUp ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          <span>{formatPrice(Math.abs(stock.change ?? 0), stock.currency)}</span>
          <span>({formatPercent(stock.changePercent, { signed: true })})</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-ink-700">
          <Icon size={18} className="text-sky-600" />
          <span className="text-sm font-medium">{stock.sector || "Sector unavailable"}</span>
          {stock.industry && (
            <span className="text-xs text-ink-500">· {stock.industry}</span>
          )}
        </div>
      </div>

      <Range52Week
        low={stock.week52Low}
        high={stock.week52High}
        price={stock.price}
        currency={stock.currency}
      />

      <MarketCapSlider marketCap={stock.marketCap} currency={stock.currency} />
    </Card>
  );
}
