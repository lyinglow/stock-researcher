import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function FavoriteTickers({ favorites, active, onSelect, onRemove }) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="trading-favorites">
      {favorites.map((ticker, i) => (
        <motion.div
          key={ticker}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          data-testid={`trading-favorite-chip-${ticker}`}
          className={`group flex items-center gap-1.5 rounded-full border py-1.5 pl-3.5 pr-1.5 text-sm font-semibold
            shadow-soft transition ${
              active === ticker
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-butter-200/70 bg-white/80 text-ink-700 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
        >
          <button type="button" onClick={() => onSelect(ticker)}>
            {ticker}
          </button>
          <button
            type="button"
            onClick={() => onRemove(ticker)}
            aria-label={`Remove ${ticker} from favorites`}
            data-testid={`trading-favorite-remove-${ticker}`}
            className="rounded-full p-1 text-ink-500 opacity-0 transition
              hover:bg-butter-100 hover:text-rose-600 group-hover:opacity-100"
          >
            <X size={12} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
