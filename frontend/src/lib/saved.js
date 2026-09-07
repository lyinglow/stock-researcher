const KEY = "stock-researcher:saved";
const MAX_SAVED = 30;

export function getSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSaved(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // private browsing / storage disabled - saving just won't persist
  }
}

export function toggleSaved(ticker, name) {
  const list = getSaved();
  const exists = list.some((s) => s.ticker === ticker);
  const next = exists
    ? list.filter((s) => s.ticker !== ticker)
    : [{ ticker, name }, ...list].slice(0, MAX_SAVED);
  setSaved(next);
  return next;
}

export function removeSaved(ticker) {
  const next = getSaved().filter((s) => s.ticker !== ticker);
  setSaved(next);
  return next;
}
