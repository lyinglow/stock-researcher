import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import Metric from "./Metric";
import { formatPrice } from "../lib/format";

const SEGMENTS = [
  { key: "analystBuy", label: "Buy", color: "bg-emerald-500", text: "text-emerald-600" },
  { key: "analystHold", label: "Hold", color: "bg-ink-500/40", text: "text-ink-500" },
  { key: "analystSell", label: "Sell", color: "bg-rose-500", text: "text-rose-600" },
];

export default function AnalystRatings({ stock }) {
  const buy = stock.analystBuy || 0;
  const hold = stock.analystHold || 0;
  const sell = stock.analystSell || 0;
  const total = buy + hold + sell;

  const consensus = SEGMENTS.reduce((best, seg) => {
    const count = stock[seg.key] || 0;
    return count > (stock[best.key] || 0) ? seg : best;
  }, SEGMENTS[0]);

  return (
    <Card testId="analyst-ratings" delay={0.25} className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          Analyst consensus
        </span>
        <span
          className={`font-display text-4xl font-semibold ${consensus.text}`}
          data-testid="analyst-consensus"
        >
          {total > 0 ? consensus.label : "No coverage"}
        </span>
        {total > 0 && (
          <span className="text-xs text-ink-500">{total} analysts</span>
        )}
      </div>

      <div className="md:col-span-1" data-testid="analyst-breakdown">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-butter-200">
          {SEGMENTS.map((seg) => {
            const count = stock[seg.key] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <motion.div
                key={seg.key}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={seg.color}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs">
          {SEGMENTS.map((seg) => (
            <span key={seg.key} className={`font-medium ${seg.text}`}>
              {seg.label} {stock[seg.key] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-start md:justify-end">
        <Metric
          label="Mean price target"
          tooltip="The average 12-month price target across covering analysts."
          value={formatPrice(stock.analystMeanTarget, stock.currency)}
          valueClassName="text-2xl"
          testId="mean-price-target"
        />
      </div>
    </Card>
  );
}
