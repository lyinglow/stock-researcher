/** @type {import('tailwindcss').Config} */

/** Builds a Tailwind color scale backed by CSS custom properties, so the
 * same class names (bg-butter-50, border-ink-500/70, etc.) resolve to
 * different values in light vs dark mode - the actual swap happens once,
 * in index.css, not in every component. */
function cssVarScale(name, keys) {
  return Object.fromEntries(
    keys.map((key) => [key, `rgb(var(--color-${name}-${key}) / <alpha-value>)`])
  );
}

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        butter: cssVarScale("butter", [50, 100, 200, 300]),
        sky: cssVarScale("sky", [50, 100, 200, 300, 400, 500, 600, 700]),
        ink: cssVarScale("ink", [900, 700, 500]),
        surface: cssVarScale("surface", [100, 200]),
      },
      fontFamily: {
        serif: ["Ropa Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Ropa Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--color-ink-900) / 0.04), 0 8px 24px rgb(var(--color-ink-900) / 0.06)",
        glow: "0 0 60px rgb(var(--color-sky-500) / 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
