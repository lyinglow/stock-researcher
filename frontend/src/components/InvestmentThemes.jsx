import React from "react";
import { motion } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import Tooltip from "./Tooltip";
import RatingBars from "./RatingBars";
import usePolledFeed from "../lib/usePolledFeed";
import { getThemes } from "../lib/api";

function ThemeCard({ theme, onSelect, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      data-testid={`theme-card-${theme.name}`}
      className="flex flex-col gap-3 rounded-xl2 border border-butter-200/70 bg-white/80 p-4 shadow-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-base text-ink-900">{theme.name}</div>
        <Tooltip label="How strongly this theme is backed by current news and investor discussion, 5 being highest.">
          <RatingBars rating={theme.confidence} label="Confidence" />
        </Tooltip>
      </div>
      <p className="text-sm leading-snug text-ink-700">{theme.thesis}</p>
      {theme.evidence && (
        <p className="text-xs leading-snug text-ink-500">{theme.evidence}</p>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {theme.tickers.map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => onSelect(ticker)}
            data-testid={`theme-ticker-${ticker}`}
            className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700
              transition hover:bg-sky-200"
          >
            {ticker}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function InvestmentThemes({ onSelect }) {
  const { data, loading, failed } = usePolledFeed(getThemes);

  if (failed) return null;

  const themeList = data?.themes || [];
  const isPending = loading && themeList.length === 0;

  if (!isPending && themeList.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-10" data-testid="themes-section">
      <div className="mb-4 flex items-center justify-center gap-2 text-ink-700">
        <Compass size={18} className="text-sky-600" />
        <h2 className="font-display text-xl text-ink-900">Investment themes</h2>
        <Tooltip label="Ideas gaining attention in both financial news and retail-investor discussion this week, ranked by how well the evidence backs them up. A starting point, not advice.">
          <span className="cursor-help text-xs text-ink-500">ⓘ</span>
        </Tooltip>
      </div>

      {isPending ? (
        <div
          className="flex items-center justify-center gap-2 text-center text-sm text-ink-500"
          data-testid="themes-pending"
        >
          <Loader2 size={14} className="animate-spin" />
          Scanning news and investor discussion for emerging themes…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themeList.map((theme, i) => (
            <ThemeCard key={theme.name} theme={theme} onSelect={onSelect} delay={i * 0.05} />
          ))}
        </div>
      )}
    </section>
  );
}
