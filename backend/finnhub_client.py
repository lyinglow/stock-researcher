"""Thin wrapper around the Finnhub API (free tier).

Replaced Yahoo/yfinance because Yahoo now blocks its free quoteSummary
API from cloud/datacenter IPs outright ("Invalid Crumb" / "user unable
to access this feature") - a deliberate block, not a network fault, and
no session trick gets past it. Finnhub's free tier covers quote,
company profile, key metrics, and analyst recommendations for US-listed
tickers (including US ADRs of foreign companies); it 403s on anything
listed only on a non-US exchange, and on analyst price targets and
historical daily candles for any ticker, so those come back empty
rather than crash. Every free-tier quote that resolves is USD, so we
don't bother threading currency conversion through - it's the display
currency for everything this backend can actually reach.
"""
import logging
import os
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://finnhub.io/api/v1"


class TickerNotFound(Exception):
    pass


def _get(path: str, **params) -> dict:
    params["token"] = os.environ.get("FINNHUB_API_KEY", "")
    resp = requests.get(f"{BASE_URL}{path}", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _get_quote(symbol: str) -> dict:
    try:
        return _get("/quote", symbol=symbol)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code in (403, 404):
            raise TickerNotFound(symbol) from e
        raise


def _num(d: dict, *keys, default=None):
    for key in keys:
        val = d.get(key)
        if val is not None:
            return val
    return default


def _fetch_profile(symbol: str) -> dict:
    try:
        return _get("/stock/profile2", symbol=symbol)
    except Exception:
        logger.exception("profile fetch failed for %s", symbol)
        return {}


def _fetch_metrics(symbol: str) -> dict:
    try:
        return _get("/stock/metric", symbol=symbol, metric="all").get("metric", {})
    except Exception:
        logger.exception("metrics fetch failed for %s", symbol)
        return {}


def fetch_analyst_counts(symbol: str) -> dict:
    try:
        recs = _get("/stock/recommendation", symbol=symbol)
        if recs:
            latest = recs[0]
            return {
                "buy": int(latest.get("strongBuy", 0)) + int(latest.get("buy", 0)),
                "hold": int(latest.get("hold", 0)),
                "sell": int(latest.get("sell", 0)) + int(latest.get("strongSell", 0)),
            }
    except Exception:
        logger.exception("recommendations fetch failed for %s", symbol)
    return {"buy": 0, "hold": 0, "sell": 0}


def fetch_snapshot(symbol: str) -> dict:
    """Full snapshot for GET /api/stock/{ticker}. Raises TickerNotFound for
    invalid/delisted tickers."""
    symbol = symbol.upper().strip()
    quote = _get_quote(symbol)
    price = quote.get("c")
    if not price:
        raise TickerNotFound(symbol)

    profile = _fetch_profile(symbol)
    if not profile.get("name"):
        raise TickerNotFound(symbol)

    metric = _fetch_metrics(symbol)
    analyst = fetch_analyst_counts(symbol)

    prev_close = quote.get("pc")
    change = quote.get("d")
    change_percent = quote.get("dp")

    market_cap = profile.get("marketCapitalization")
    if market_cap is not None:
        market_cap = market_cap * 1_000_000  # Finnhub reports millions

    return {
        "ticker": symbol,
        "name": profile.get("name") or symbol,
        "currency": "USD",
        "price": price,
        "previousClose": prev_close,
        "change": round(change, 4) if change is not None else None,
        "changePercent": round(change_percent, 4) if change_percent is not None else None,
        "week52High": _num(metric, "52WeekHigh"),
        "week52Low": _num(metric, "52WeekLow"),
        "marketCap": market_cap,
        "sector": profile.get("finnhubIndustry"),
        "industry": profile.get("finnhubIndustry"),
        "peRatio": _num(metric, "peTTM", "peNormalizedAnnual"),
        "forwardPE": _num(metric, "peForward"),
        "peg": _num(metric, "pegRatio", "peg5Y"),
        "eps": _num(metric, "epsTTM", "epsInclExtraItemsTTM"),
        "forwardEps": _num(metric, "epsForward"),
        "profitMargin": _num(metric, "netProfitMarginTTM"),
        "revenueGrowth": _num(metric, "revenueGrowthTTMYoy"),
        "earningsGrowth": _num(metric, "epsGrowthTTMYoy"),
        "beta": _num(metric, "beta"),
        "debtToEquity": _num(metric, "totalDebt/totalEquityAnnual"),
        "dividendYield": _num(metric, "dividendYieldIndicatedAnnual"),
        "analystBuy": analyst["buy"],
        "analystHold": analyst["hold"],
        "analystSell": analyst["sell"],
        "analystMeanTarget": None,  # price-target is a paid Finnhub endpoint
        "priceHistory": [],  # daily candles are a paid Finnhub endpoint
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }


def fetch_competitor_snapshot(symbol: str) -> dict:
    """Lightweight snapshot for the competitor comparison table. EPS is
    derived from price/PE when Finnhub doesn't report it directly."""
    symbol = symbol.upper().strip()
    quote = _get_quote(symbol)
    price = quote.get("c")
    if not price:
        raise TickerNotFound(symbol)

    profile = _fetch_profile(symbol)
    metric = _fetch_metrics(symbol)

    market_cap_usd = profile.get("marketCapitalization")
    market_cap_usd = market_cap_usd * 1_000_000 if market_cap_usd else None

    pe = _num(metric, "peTTM", "peNormalizedAnnual")
    eps = _num(metric, "epsTTM")
    if eps is None and pe:
        eps = round(price / pe, 4)

    return {
        "ticker": symbol,
        "name": profile.get("name") or symbol,
        "currency": "USD",
        "price": price,
        "marketCapUsd": market_cap_usd,
        "peRatio": pe,
        "eps": eps,
        "revenueGrowth": _num(metric, "revenueGrowthTTMYoy"),
        "profitMargin": _num(metric, "netProfitMarginTTM"),
    }
