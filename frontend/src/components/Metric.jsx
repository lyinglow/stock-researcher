import React from "react";
import { Info } from "lucide-react";
import Tooltip from "./Tooltip";

export default function Metric({ label, tooltip, value, testId, valueClassName = "" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <span className="truncate">{label}</span>
        {tooltip && (
          <Tooltip label={tooltip}>
            <Info size={12} className="cursor-help text-ink-500/70" />
          </Tooltip>
        )}
      </div>
      <div className={`font-display text-lg text-ink-900 ${valueClassName}`}>{value}</div>
    </div>
  );
}
