import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Star } from "lucide-react";
import TradingStats from "./TradingStats";
import TradingChart from "./TradingChart";
import SignalTable from "./SignalTable";
import FavoriteTickers from "./FavoriteTickers";
import TradingSettings from "./TradingSettings";
import { getTradingSignal } from "../../lib/api";
import { getTradingFavorites, toggleTradingFavorite, removeTradingFavorite } from "../../lib/tradingFavorites";

function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md items-center gap-2">
      <div className="relative flex-1">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Try AAPL, TSLA, or SOL-USD, BTC-USD…"
          data-testid="trading-ticker-input"
          className="w-full rounded-full border border-butter-200 bg-white/90 py-3 pl-11 pr-4
            font-display text-lg text-ink-900 shadow-soft outline-none transition
            focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        data-testid="trading-search-btn"
        className="flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3
          font-semibold text-white shadow-soft transition hover:bg-sky-600
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Check signal"}
      </button>
    </form>
  );
}

const DEFAULT_SETTINGS = { macroMult: 3.0, noiseSuppression: "medium" };

export default function Trading() {
  const [signal, setSignal] = useState(null);
  const [ticker, setTicker] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(getTradingFavorites);

  const isFavorite = useMemo(
    () => !!signal && favorites.includes(signal.ticker),
    [favorites, signal]
  );

  const runSearch = useCallback(async (tk, opts) => {
    setLoading(true);
    setError(null);
    setTicker(tk);
    try {
      const data = await getTradingSignal(tk, opts);
      setSignal(data);
    } catch (e) {
      setSignal(null);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((tk) => runSearch(tk, settings), [runSearch, settings]);

  const handleSettingsChange = useCallback(
    (next) => {
      setSettings(next);
      if (ticker) runSearch(ticker, next);
    },
    [ticker, runSearch]
  );

  // Jump straight to your top favorite (Solana, or whatever's pinned first)
  // the moment you land on this tab, instead of making you search it again.
  useEffect(() => {
    if (favorites.length > 0) {
      runSearch(favorites[0], DEFAULT_SETTINGS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (!signal) return;
    setFavorites(toggleTradingFavorite(signal.ticker));
  }, [signal]);

  const handleRemoveFavorite = useCallback((ticker) => {
    setFavorites(removeTradingFavorite(ticker));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-24 pt-4">
      {!signal && !loading && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Where's the trend, and where's the exit?
          </h1>
          <p className="max-w-md text-ink-700">
            The same ATR trend and range logic we built and backtested, now on any stock
            or crypto pair.
          </p>
        </div>
      )}

      <SearchBar onSearch={handleSearch} loading={loading} />
      <TradingSettings
        macroMult={settings.macroMult}
        noiseSuppression={settings.noiseSuppression}
        onChange={handleSettingsChange}
      />
      <FavoriteTickers
        favorites={favorites}
        active={signal?.ticker}
        onSelect={handleSearch}
        onRemove={handleRemoveFavorite}
      />
      {error && (
        <p className="text-sm font-medium text-rose-600" data-testid="trading-error">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {signal && (
          <motion.div
            key={signal.ticker}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl text-ink-900">{signal.ticker}</h2>
              <button
                type="button"
                onClick={handleToggleFavorite}
                data-testid="trading-favorite-btn"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs
                  font-semibold transition ${
                    isFavorite
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-butter-200 bg-white/80 text-ink-500 hover:text-amber-600"
                  }`}
              >
                <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Favorited" : "Favorite"}
              </button>
            </div>
            <TradingStats signal={signal} />
            <TradingChart signal={signal} />
            <SignalTable signals={signal.signals} />
            <p className="text-xs leading-relaxed text-ink-500">
              This is a backtest of past signals, not a forecast. No fees or slippage are
              modeled, and every asset we tested this logic on saw a drawdown of 65% or worse
              at some point. Treat it as a starting point, not an answer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
