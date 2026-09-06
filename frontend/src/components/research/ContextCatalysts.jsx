import React from "react";
import { Sparkles } from "lucide-react";
import Card from "../Card";
import Metric from "../Metric";
import Sparkline from "./Sparkline";
import { formatPrice } from "../../lib/format";

export default function ContextCatalysts({ stock, research }) {
  const data = research?.context_catalysts;
  return (
    <Card testId="card-context-catalysts" delay={0.1} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-sky-600" />
        <h3 className="font-display text-xl text-ink-900">Context &amp; catalysts</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="Price" value={formatPrice(stock.price, stock.currency)} tooltip="Current trading price." />
        <Metric label="52w high" value={formatPrice(stock.week52High, stock.currency)} tooltip="Highest closing price in the last year." />
        <Metric label="52w low" value={formatPrice(stock.week52Low, stock.currency)} tooltip="Lowest closing price in the last year." />
      </div>

      <Sparkline
        history={stock.priceHistory}
        low={stock.week52Low}
        high={stock.week52High}
        currency={stock.currency}
      />

      {data ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-ink-700" data-testid="business-summary">
            {data.business_summary}
          </p>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Catalysts, next 12 months
            </div>
            <ul className="flex flex-col gap-2" data-testid="catalyst-list">
              {(data.catalysts || []).map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <ResearchPlaceholder />
      )}
    </Card>
  );
}

function ResearchPlaceholder() {
  return (
    <div className="h-16 animate-pulse rounded-lg bg-butter-100" />
  );
}
