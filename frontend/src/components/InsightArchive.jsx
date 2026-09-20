import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Flame, Loader2 } from "lucide-react";
import { getDiscoverHistory, getThemesHistory } from "../lib/api";

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

/** Combines the daily Latest Insight and Investment Themes history into one
 * browsable record: a "mentioned again and again" roll-up of whatever keeps
 * coming up, plus a day-by-day list underneath. */
export default function InsightArchive({ onSelect }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDiscoverHistory(), getThemesHistory()])
      .then(([discoverRes, themesRes]) => {
        if (cancelled) return;
        const byDate = {};
        for (const day of discoverRes.days || []) {
          byDate[day.date] = { ...byDate[day.date], date: day.date, opportunities: day.opportunities || [] };
        }
        for (const day of themesRes.days || []) {
          byDate[day.date] = { ...byDate[day.date], date: day.date, themes: day.themes || [] };
        }
        const merged = Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1));
        setDays(merged);
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
      for (const theme of day.themes || []) {
        for (const ticker of theme.tickers || []) {
          counts[ticker] = (counts[ticker] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([ticker, count]) => ({ ticker, count }))
      .filter((t) => t.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [days]);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24" data-testid="archive-section">
      <div className="mb-6 flex items-center justify-center gap-2 text-ink-700">
        <Calendar size={18} className="text-sky-600" />
        <h2 className="font-display text-xl text-ink-900">Past picks</h2>
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
        <>
          {topTickers.length > 0 && (
            <div className="mb-8 rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <Flame size={14} className="text-sky-600" />
                Coming up again and again
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topTickers.map(({ ticker, count }) => (
                  <TickerChip key={ticker} ticker={ticker} count={count} onSelect={onSelect} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {days.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                data-testid={`archive-day-${day.date}`}
                className="rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {formatDate(day.date)}
                </div>
                {day.opportunities?.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {day.opportunities.map((opp) => (
                      <TickerChip key={opp.ticker} ticker={opp.ticker} count={1} onSelect={onSelect} />
                    ))}
                  </div>
                )}
                {day.themes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(day.themes.flatMap((theme) => theme.tickers || []))].map((ticker) => (
                      <TickerChip key={ticker} ticker={ticker} count={1} onSelect={onSelect} />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
