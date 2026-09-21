import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import TradingStats from "./TradingStats";
import TradingChart from "./TradingChart";
import SignalTable from "./SignalTable";
import { getTradingSignal } from "../../lib/api";

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
          placeholder="Try AAPL, MSFT, TSLA…"
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

export default function Trading() {
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async (ticker) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTradingSignal(ticker);
      setSignal(data);
    } catch (e) {
      setSignal(null);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-24 pt-4">
      {!signal && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Where's the trend, and where's the exit?
          </h1>
          <p className="max-w-md text-ink-700">
            The same ATR trend and range logic we built and backtested, now on any stock.
          </p>
        </div>
      )}

      <SearchBar onSearch={handleSearch} loading={loading} />
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
