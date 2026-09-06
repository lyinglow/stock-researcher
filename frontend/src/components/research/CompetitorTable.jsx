import React from "react";
import { formatPrice, formatMarketCap, formatNumber, formatPercent } from "../../lib/format";

const ROWS = [
  { key: "price", label: "Price", fmt: (v, c) => formatPrice(v, c.currency) },
  { key: "marketCapUsd", label: "Market cap", fmt: (v) => formatMarketCap(v, "USD") },
  { key: "peRatio", label: "P/E", fmt: (v) => formatNumber(v, 1) },
  { key: "eps", label: "EPS", fmt: (v, c) => formatPrice(v, c.currency) },
  { key: "revenueGrowth", label: "Revenue growth", fmt: (v) => formatPercent(v, { alreadyPercent: false, signed: true }) },
  { key: "profitMargin", label: "Profit margin", fmt: (v) => formatPercent(v, { alreadyPercent: false }) },
];

export default function CompetitorTable({ primary, competitors }) {
  const columns = [primary, ...competitors].filter(Boolean);
  if (columns.length === 0) return null;

  return (
    <div className="overflow-x-auto" data-testid="competitor-table">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-32 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Metric
            </th>
            {columns.map((c) => (
              <th
                key={c.ticker}
                className="pb-2 text-left font-display text-base font-medium text-ink-900"
              >
                {c.name}
                <div className="text-[11px] font-sans font-normal uppercase tracking-wide text-ink-500">
                  {c.ticker}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-t border-butter-200/70">
              <td className="py-2 text-ink-500">{row.label}</td>
              {columns.map((c) => (
                <td key={c.ticker} className="py-2 font-medium text-ink-900">
                  {row.fmt(c[row.key], c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
