export function formatPrice(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMarketCap(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const symbol = currency === "USD" ? "$" : "";
  return `${symbol}${formatCompact(value)}${currency !== "USD" ? ` ${currency}` : ""}`;
}

export function formatPercent(value, { alreadyPercent = true, signed = false, digits = 1 } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = alreadyPercent ? value : value * 100;
  const sign = signed && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

const CAP_TIERS = [
  { label: "Micro", max: 3e8 },
  { label: "Small", max: 2e9 },
  { label: "Mid", max: 1e10 },
  { label: "Large", max: 2e11 },
  { label: "Mega", max: Infinity },
];

export function capTier(marketCap) {
  if (!marketCap) return CAP_TIERS[0];
  return CAP_TIERS.find((t) => marketCap <= t.max) || CAP_TIERS[CAP_TIERS.length - 1];
}

const LOG_MIN = Math.log10(1e7);
const LOG_MAX = Math.log10(4e12);

export function capSliderPosition(marketCap) {
  if (!marketCap || marketCap <= 0) return 0;
  const clamped = Math.min(Math.max(marketCap, 10 ** LOG_MIN), 10 ** LOG_MAX);
  const pos = (Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return Math.min(100, Math.max(0, pos * 100));
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
