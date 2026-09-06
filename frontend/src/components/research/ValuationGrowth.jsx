import React from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import Card from "../Card";
import Metric from "../Metric";
import MarginGauge from "./MarginGauge";
import GrowthBars from "./GrowthBars";
import { formatNumber } from "../../lib/format";

export default function ValuationGrowth({ stock, research }) {
  const data = research?.valuation_growth;
  return (
    <Card testId="card-valuation-growth" delay={0.15} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <LineChartIcon size={18} className="text-sky-600" />
        <h3 className="font-display text-xl text-ink-900">Valuation &amp; growth</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Metric label="P/E" value={formatNumber(stock.peRatio, 1)} tooltip="Price divided by trailing 12-month earnings per share. Higher usually means the market expects more growth." />
        <Metric label="Fwd P/E" value={formatNumber(stock.forwardPE, 1)} tooltip="Price divided by analysts' expected earnings for the next 12 months." />
        <Metric label="PEG" value={formatNumber(stock.peg, 2)} tooltip="P/E divided by expected earnings growth. Near 1 is considered fairly priced." />
        <Metric label="EPS" value={formatNumber(stock.eps, 2)} tooltip="Earnings per share over the trailing 12 months." />
      </div>

      <div className="grid grid-cols-2 items-center gap-4 rounded-xl bg-butter-50/60 p-4">
        <MarginGauge profitMargin={stock.profitMargin} />
        <GrowthBars revenueGrowth={stock.revenueGrowth} earningsGrowth={stock.earningsGrowth} />
      </div>

      {data ? (
        <div className="flex flex-col gap-2" data-testid="valuation-summary">
          <p className="text-sm leading-relaxed text-ink-700">{data.valuation_summary}</p>
          <p className="text-sm leading-relaxed text-ink-700">{data.growth_summary}</p>
        </div>
      ) : (
        <div className="h-16 animate-pulse rounded-lg bg-butter-100" />
      )}
    </Card>
  );
}
