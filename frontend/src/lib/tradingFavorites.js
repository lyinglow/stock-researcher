const KEY = "stock-researcher:trading-favorites";
const MAX_FAVORITES = 20;

export function getTradingFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTradingFavorites(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // private browsing / storage disabled - favoriting just won't persist
  }
}

export function toggleTradingFavorite(ticker) {
  const list = getTradingFavorites();
  const exists = list.includes(ticker);
  const next = exists ? list.filter((t) => t !== ticker) : [ticker, ...list].slice(0, MAX_FAVORITES);
  setTradingFavorites(next);
  return next;
}

export function removeTradingFavorite(ticker) {
  const next = getTradingFavorites().filter((t) => t !== ticker);
  setTradingFavorites(next);
  return next;
}
