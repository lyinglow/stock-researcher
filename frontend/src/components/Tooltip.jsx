import React from "react";

export default function Tooltip({ label, children, testId }) {
  return (
    <span
      className="relative inline-flex items-center group/tip outline-none"
      tabIndex={0}
      data-testid={testId}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56
          -translate-x-1/2 rounded-lg bg-ink-900 px-3 py-2 text-xs leading-snug text-butter-50
          opacity-0 shadow-soft transition-opacity duration-150
          group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink-900" />
      </span>
    </span>
  );
}
