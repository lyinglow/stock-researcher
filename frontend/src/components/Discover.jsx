import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import Tooltip from "./Tooltip";
import { getDiscover } from "../lib/api";

const POLL_MS = 10000;
const MAX_POLLS = 30; // web search generation can take several minutes

function RatingBars({ rating }) {
  return (
    <div className="flex items-end gap-0.5" aria-label={`Opportunity rating ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-1.5 rounded-sm ${n <= rating ? "bg-sky-500" : "bg-butter-200"}`}
          style={{ height: `${8 + n * 3}px` }}
        />
      ))}
    </div>
  );
}

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
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const pollCount = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getDiscover();
        if (cancelled) return;
        if (result.pending) {
          if (pollCount.current < MAX_POLLS) {
            setData(result);
            pollCount.current += 1;
            timerRef.current = setTimeout(load, POLL_MS);
          } else {
            setFailed(true); // gave up waiting; hide the section rather than stay stuck
          }
        } else {
          setData(result);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (failed || !data) return null;

  const opportunities = data.opportunities || [];
  const isPending = data.pending && opportunities.length === 0;

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
        <div className="text-center text-sm text-ink-500" data-testid="discover-pending">
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
