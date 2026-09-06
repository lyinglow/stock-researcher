const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = `${BACKEND_URL}/api`;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export function getStock(ticker) {
  return request(`/stock/${encodeURIComponent(ticker)}`);
}

export function postResearch(ticker) {
  return request(`/research`, {
    method: "POST",
    body: JSON.stringify({ ticker }),
  });
}

export function postCompetitors(ticker, tickers) {
  return request(`/competitors`, {
    method: "POST",
    body: JSON.stringify({ ticker, tickers }),
  });
}

export { ApiError };
