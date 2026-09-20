import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Flame, Loader2 } from "lucide-react";
import RatingBars from "./RatingBars";
import Tooltip from "./Tooltip";
import { DiscoverCard } from "./Discover";
import { ThemeCard } from "./InvestmentThemes";
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
 * browsable record: which tickers and themes keep coming back, how each
 * theme's confidence compares to the others, and the full day-by-day cards
 * underneath for the detail. */
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

  const rankedThemes = useMemo(() => {
    const byName = {};
    for (const day of days) {
      for (const theme of day.themes || []) {
        const key = theme.name.trim().toLowerCase();
        if (!byName[key]) {
          byName[key] = { name: theme.name, count: 0, confidenceTotal: 0, tickers: new Set() };
        }
        byName[key].count += 1;
        byName[key].confidenceTotal += theme.confidence || 0;
        for (const ticker of theme.tickers || []) byName[key].tickers.add(ticker);
      }
    }
    return Object.values(byName)
      .map((t) => ({
        name: t.name,
        count: t.count,
        confidence: Math.round(t.confidenceTotal / t.count),
        tickers: Array.from(t.tickers),
      }))
      .sort((a, b) => b.confidence - a.confidence || b.count - a.count)
      .slice(0, 8);
  }, [days]);

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24" data-testid="archive-section">
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
        <div className="flex flex-col gap-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
            {topTickers.length > 0 && (
              <div className="rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft">
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

            {rankedThemes.length > 0 && (
              <div
                className="rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft"
                data-testid="archive-theme-strength"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Themes ranked by confidence
                  <Tooltip label="Each theme's average confidence rating across every time it's shown up, strongest first - so you can see how it compares to every other theme spotted.">
                    <span className="cursor-help text-ink-400">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="flex flex-col gap-2.5">
                  {rankedThemes.map((theme) => (
                    <div key={theme.name} className="flex items-center gap-3">
                      <RatingBars rating={theme.confidence} label="Confidence" />
                      <span className="flex-1 truncate text-sm text-ink-800">{theme.name}</span>
                      {theme.count > 1 && (
                        <span className="shrink-0 text-xs text-ink-400">seen {theme.count}×</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  {(day.themes || []).map((theme, i) => (
                    <ThemeCard key={theme.name} theme={theme} onSelect={onSelect} delay={i * 0.03} />
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
