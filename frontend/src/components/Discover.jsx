import React from "react";
import { motion } from "framer-motion";
import { Radar, Loader2 } from "lucide-react";
import Tooltip from "./Tooltip";
import RatingBars from "./RatingBars";
import usePolledFeed from "../lib/usePolledFeed";
import { getDiscover } from "../lib/api";

function DiscoverCard({ opp, onSelect, delay }) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(opp.ticker)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      data-testid={`discover-card-${opp.ticker}`}
      className="flex flex-col gap-2 rounded-xl2 border border-butter-200/70 bg-white/80 p-4
        text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-base text-ink-900">{opp.name}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
            {opp.ticker}
          </div>
        </div>
        <Tooltip label="How urgent and significant this opportunity looks, 5 being highest.">
          <RatingBars rating={opp.rating} />
        </Tooltip>
      </div>
      <p className="text-sm leading-snug text-ink-700">{opp.trigger}</p>
      <p className="text-sm leading-snug text-ink-500">{opp.connection}</p>
    </motion.button>
  );
}

export default function Discover({ onSelect }) {
  const { data, loading, failed } = usePolledFeed(getDiscover);

  if (failed) return null;

  const opportunities = data?.opportunities || [];
  const isPending = loading && opportunities.length === 0;

  if (!isPending && opportunities.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-10" data-testid="discover-section">
      <div className="mb-4 flex items-center justify-center gap-2 text-ink-700">
        <Radar size={18} className="text-sky-600" />
        <h2 className="font-display text-xl text-ink-900">Latest Insight</h2>
        <Tooltip label="Companies that may be indirectly affected by recent business news through supply chain, customer, or competitor relationships. A lead to investigate, not a fact.">
          <span className="cursor-help text-xs text-ink-500">ⓘ</span>
        </Tooltip>
      </div>

      {isPending ? (
        <div
          className="flex items-center justify-center gap-2 text-center text-sm text-ink-500"
          data-testid="discover-pending"
        >
          <Loader2 size={14} className="animate-spin" />
          Scanning today's business news for supply chain opportunities…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp, i) => (
            <DiscoverCard key={opp.ticker} opp={opp} onSelect={onSelect} delay={i * 0.05} />
          ))}
        </div>
      )}
    </section>
  );
}
