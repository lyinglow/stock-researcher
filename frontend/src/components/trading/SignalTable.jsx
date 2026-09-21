import React, { useState } from "react";
import Card from "../Card";
import { formatPrice } from "../../lib/format";

export default function SignalTable({ signals }) {
  const [expanded, setExpanded] = useState(false);
  if (!signals?.length) return null;

  const rows = expanded ? [...signals].reverse() : [...signals].reverse().slice(0, 5);

  return (
    <Card testId="signal-table" delay={0.1}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-ink-900">Signal history</h2>
        <span className="text-xs text-ink-500">{signals.length} total</span>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Date
            </th>
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Signal
            </th>
            <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={`${s.date}-${s.type}`} className="border-t border-butter-200/70">
              <td className="py-2 text-ink-900">{s.date}</td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    s.type === "BUY"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {s.type}
                </span>
              </td>
              <td className="py-2 font-medium text-ink-900">{formatPrice(s.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {signals.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-sky-600 underline decoration-dotted underline-offset-4 hover:text-sky-700"
        >
          {expanded ? "Show fewer" : `Show all ${signals.length}`}
        </button>
      )}
    </Card>
  );
}
