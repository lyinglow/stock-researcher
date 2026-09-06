import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Loader2, Users } from "lucide-react";
import Card from "../Card";
import Metric from "../Metric";
import CompetitorTable from "./CompetitorTable";
import { postCompetitors } from "../../lib/api";
import { formatNumber, formatPercent } from "../../lib/format";

export default function CompetitorsRisks({ stock, research }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const risksData = research?.competitors_risks;

  async function loadCompetitors() {
    setLoading(true);
    setError(null);
    try {
      const tickers = research?.competitor_tickers;
      const result = await postCompetitors(stock.ticker, tickers);
      setData(result);
    } catch (e) {
      setError(e.message || "Could not load competitors");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card testId="card-competitors-risks" delay={0.2} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="text-sky-600" />
        <h3 className="font-display text-xl text-ink-900">Competitors &amp; risks</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="Beta" value={formatNumber(stock.beta, 2)} tooltip="How much this stock swings relative to the overall market. Above 1 means more volatile than the market." />
        <Metric label="Debt/Equity" value={formatNumber(stock.debtToEquity, 1)} tooltip="Total debt compared to shareholder equity. Higher means more leverage." />
        <Metric label="Div yield" value={formatPercent(stock.dividendYield)} tooltip="Annual dividend as a percentage of the current share price." />
      </div>

      {risksData ? (
        <p className="text-sm leading-relaxed text-ink-700" data-testid="risks-summary">
          {risksData.risks}
        </p>
      ) : (
        <div className="h-12 animate-pulse rounded-lg bg-butter-100" />
      )}

      <div>
        <button
          type="button"
          onClick={loadCompetitors}
          disabled={loading || !research}
          data-testid="load-competitors-btn"
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm
            font-semibold text-white shadow-soft transition hover:bg-sky-600
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          {data ? "Refresh comparison" : "Compare with top 2 competitors"}
        </button>
        {error && (
          <p className="mt-2 text-xs text-rose-600" data-testid="competitors-error">
            {error}
          </p>
        )}
      </div>

      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <CompetitorTable primary={data.primary} competitors={data.competitors} />
            {risksData?.moat_note && (
              <p className="rounded-lg bg-sky-50 p-3 text-sm leading-relaxed text-ink-700" data-testid="moat-note">
                {risksData.moat_note}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
