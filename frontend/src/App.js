import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Loader2 } from "lucide-react";
import KeyDataPanel from "./components/KeyDataPanel";
import PriceChart from "./components/PriceChart";
import ContextCatalysts from "./components/research/ContextCatalysts";
import ValuationGrowth from "./components/research/ValuationGrowth";
import CompetitorsRisks from "./components/research/CompetitorsRisks";
import AnalystRatings from "./components/AnalystRatings";
import Discover from "./components/Discover";
import { getStock, postResearch } from "./lib/api";

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
          data-testid="ticker-input"
          className="w-full rounded-full border border-butter-200 bg-white/90 py-3 pl-11 pr-4
            font-display text-lg text-ink-900 shadow-soft outline-none transition
            focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        data-testid="search-btn"
        className="flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3
          font-semibold text-white shadow-soft transition hover:bg-sky-600
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Research"}
      </button>
    </form>
  );
}

export default function App() {
  const [stock, setStock] = useState(null);
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async (ticker) => {
    setLoading(true);
    setError(null);
    setResearch(null);
    try {
      const stockData = await getStock(ticker);
      setStock(stockData);
      postResearch(ticker)
        .then(setResearch)
        .catch((e) => console.error("research failed", e));
    } catch (e) {
      setStock(null);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-butter-50">
      <header className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-10 pt-16 text-center">
        <div className="flex items-center gap-2 text-sky-600">
          <TrendingUp size={22} />
          <span className="text-sm font-semibold uppercase tracking-widest">Stock Researcher</span>
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink-900 md:text-5xl">
          Look up any stock.
        </h1>
        <p className="max-w-md text-ink-700">
          Type a ticker. See what it's worth, how it's doing, and why — in plain language.
        </p>
        <SearchBar onSearch={handleSearch} loading={loading} />
        {error && (
          <p className="text-sm font-medium text-rose-600" data-testid="stock-error">
            {error}
          </p>
        )}
      </header>

      <AnimatePresence mode="wait">
        {stock && (
          <motion.main
            key={stock.ticker}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-24"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl text-ink-900" data-testid="stock-name">
                {stock.name}
              </h2>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {stock.ticker}
              </span>
            </div>

            <KeyDataPanel stock={stock} />
            <PriceChart stock={stock} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ContextCatalysts stock={stock} research={research} />
              <ValuationGrowth stock={stock} research={research} />
            </div>
            <CompetitorsRisks stock={stock} research={research} />

            <AnalystRatings stock={stock} />
          </motion.main>
        )}
      </AnimatePresence>

      {!stock && !loading && <Discover onSelect={handleSearch} />}
    </div>
  );
}
