import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Flame, Loader2 } from "lucide-react";
import { DiscoverCard } from "./Discover";
import { getDiscoverHistory } from "../lib/api";

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function TickerChip({ ticker, count, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ticker)}
      data-testid={`archive-ticker-${ticker}`}
      className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold
        text-sky-700 transition hover:bg-sky-200"
    >
      {ticker}
      {count > 1 && <span className="text-sky-500">×{count}</span>}
    </button>
  );
}

/** A browsable record of the daily supply-chain scan (Latest Insight) only -
 * which tickers keep coming back, and the full day-by-day cards underneath
 * for the detail. Investment Themes lives only on the landing page. */
export default function InsightArchive({ onSelect }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getDiscoverHistory()
      .then((res) => {
        if (cancelled) return;
        const sorted = [...(res.days || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
        setDays(sorted);
      })
      .catch(() => setDays([]))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const topTickers = useMemo(() => {
    const counts = {};
    for (const day of days) {
      for (const opp of day.opportunities || []) {
        counts[opp.ticker] = (counts[opp.ticker] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([ticker, count]) => ({ ticker, count }))
      .filter((t) => t.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [days]);

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24" data-testid="archive-section">
      <div className="mb-6 flex items-center justify-center gap-2 text-ink-700">
        <Calendar size={18} className="text-sky-600" />
        <h2 className="font-display text-xl text-ink-900">Supply chain picks</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500">
          <Loader2 size={14} className="animate-spin" />
          Loading history…
        </div>
      ) : days.length === 0 ? (
        <p className="text-center text-sm text-ink-500">
          Nothing saved yet - check back after a day or two.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {topTickers.length > 0 && (
            <div className="mx-auto w-full max-w-3xl rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <Flame size={14} className="text-sky-600" />
                Tickers coming up again and again
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topTickers.map(({ ticker, count }) => (
                  <TickerChip key={ticker} ticker={ticker} count={count} onSelect={onSelect} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {days.map((day) => (
              <div key={day.date} data-testid={`archive-day-${day.date}`}>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {formatDate(day.date)}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(day.opportunities || []).map((opp, i) => (
                    <DiscoverCard key={opp.ticker} opp={opp} onSelect={onSelect} delay={i * 0.03} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
