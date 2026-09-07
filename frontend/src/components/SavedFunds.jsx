import React from "react";
import { motion } from "framer-motion";
import { Bookmark, X } from "lucide-react";

export default function SavedFunds({ saved, onSelect, onRemove }) {
  if (!saved || saved.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-6" data-testid="saved-section">
      <div className="mb-4 flex items-center justify-center gap-2 text-ink-700">
        <Bookmark size={18} className="text-sky-600" />
        <h2 className="font-display text-xl text-ink-900">Saved</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {saved.map((s, i) => (
          <motion.div
            key={s.ticker}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            data-testid={`saved-chip-${s.ticker}`}
            className="group flex items-center gap-2 rounded-full border border-butter-200/70
              bg-white/80 py-2 pl-4 pr-2 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <button
              type="button"
              onClick={() => onSelect(s.ticker)}
              className="flex items-baseline gap-1.5 text-left"
            >
              <span className="text-sm font-semibold text-sky-600">{s.ticker}</span>
              <span className="text-xs text-ink-500">{s.name}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(s.ticker)}
              aria-label={`Remove ${s.ticker} from saved`}
              data-testid={`saved-remove-${s.ticker}`}
              className="rounded-full p-1 text-ink-500 opacity-0 transition
                hover:bg-butter-100 hover:text-rose-600 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
