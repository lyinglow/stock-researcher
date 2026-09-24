import React from "react";

const MULT_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
const NOISE_OPTIONS = ["none", "low", "medium", "high"];

function Select({ label, value, options, labelFor, onChange, testId }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-ink-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="rounded-full border border-butter-200 bg-white/90 py-1.5 pl-3 pr-7 text-xs
          font-semibold text-ink-900 shadow-soft outline-none transition
          focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labelFor ? labelFor(opt) : opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TradingSettings({ macroMult, noiseSuppression, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4" data-testid="trading-settings">
      <Select
        label="Sensitivity"
        value={macroMult}
        options={MULT_OPTIONS}
        labelFor={(v) => `${v}x`}
        onChange={(v) => onChange({ macroMult: Number(v), noiseSuppression })}
        testId="trading-macro-mult"
      />
      <Select
        label="Noise filter"
        value={noiseSuppression}
        options={NOISE_OPTIONS}
        labelFor={(v) => v[0].toUpperCase() + v.slice(1)}
        onChange={(v) => onChange({ macroMult, noiseSuppression: v })}
        testId="trading-noise-suppression"
      />
      <span className="text-xs text-ink-500">Lower sensitivity, more signals</span>
    </div>
  );
}
