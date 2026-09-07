"""Thin wrapper around yfinance.

Yahoo requires a cookie + crumb obtained through a browser-like TLS
handshake before it'll answer quoteSummary requests; a plain
requests.Session gets a 401 from that check. yfinance's default session
(curl_cffi with Chrome impersonation) passes it, so we leave the session
alone and let yfinance manage it.
"""
import logging
from datetime import datetime, timezone

import requests
import yfinance as yf

logger = logging.getLogger(__name__)

_FX_CACHE: dict[str, float] = {}


class TickerNotFound(Exception):
    pass


def get_ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(symbol.upper().strip())


def _num(info: dict, *keys, default=None):
    for key in keys:
        val = info.get(key)
        if val is not None:
            return val
    return default


def fetch_analyst_counts(ticker_obj: yf.Ticker) -> dict:
    """Latest-month Buy/Hold/Sell breakdown, collapsing strongBuy+buy and
    strongSell+sell into the three buckets the UI shows."""
    try:
        rec = ticker_obj.recommendations
        if rec is not None and len(rec) > 0:
            row = rec[rec["period"] == "0m"]
            if len(row) == 0:
                row = rec.iloc[[0]]
            row = row.iloc[0]
            return {
                "buy": int(row.get("strongBuy", 0)) + int(row.get("buy", 0)),
                "hold": int(row.get("hold", 0)),
                "sell": int(row.get("sell", 0)) + int(row.get("strongSell", 0)),
            }
    except Exception:
        logger.exception("failed to fetch recommendations")
    return {"buy": 0, "hold": 0, "sell": 0}


def fetch_snapshot(symbol: str) -> dict:
    """Full snapshot for GET /api/stock/{ticker}. Raises TickerNotFound for
    invalid/delisted tickers."""
    t = get_ticker(symbol)
    try:
        info = t.info
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 404:
            raise TickerNotFound(symbol) from e
        raise
    except Exception as e:
        raise TickerNotFound(symbol) from e

    price = _num(info, "currentPrice", "regularMarketPrice")
    prev_close = _num(info, "previousClose", "regularMarketPreviousClose")
    if price is None or info.get("quoteType") is None:
        raise TickerNotFound(symbol)

    change = None
    change_percent = _num(info, "regularMarketChangePercent")
    if change_percent is not None:
        change_percent = change_percent * 100 if abs(change_percent) < 1 else change_percent
    if price is not None and prev_close:
        change = price - prev_close
        if change_percent is None:
            change_percent = (change / prev_close) * 100

    analyst = fetch_analyst_counts(t)

    history = []
    try:
        hist = t.history(period="1y", interval="1d")
        for idx, row in hist.iterrows():
            close = row.get("Close")
            if close is None:
                continue
            history.append({
                "date": idx.strftime("%Y-%m-%d"),
                "close": round(float(close), 4),
            })
    except Exception:
        logger.exception("failed to fetch history for %s", symbol)

    return {
        "ticker": symbol.upper().strip(),
        "name": info.get("longName") or info.get("shortName") or symbol.upper(),
        "currency": info.get("currency") or "USD",
        "price": price,
        "previousClose": prev_close,
        "change": round(change, 4) if change is not None else None,
        "changePercent": round(change_percent, 4) if change_percent is not None else None,
        "week52High": _num(info, "fiftyTwoWeekHigh"),
        "week52Low": _num(info, "fiftyTwoWeekLow"),
        "marketCap": _num(info, "marketCap"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "peRatio": _num(info, "trailingPE"),
        "forwardPE": _num(info, "forwardPE"),
        "peg": _num(info, "trailingPegRatio", "pegRatio"),
        "eps": _num(info, "trailingEps"),
        "forwardEps": _num(info, "forwardEps"),
        "profitMargin": _num(info, "profitMargins"),
        "revenueGrowth": _num(info, "revenueGrowth"),
        "earningsGrowth": _num(info, "earningsGrowth"),
        "beta": _num(info, "beta"),
        "debtToEquity": _num(info, "debtToEquity"),
        "dividendYield": _num(info, "dividendYield"),
        "analystBuy": analyst["buy"],
        "analystHold": analyst["hold"],
        "analystSell": analyst["sell"],
        "analystMeanTarget": _num(info, "targetMeanPrice"),
        "priceHistory": history,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }


def fx_rate_to_usd(currency: str) -> float:
    """Units of `currency` per 1 USD. 1.0 for USD itself."""
    currency = (currency or "USD").upper()
    if currency == "USD":
        return 1.0
    if currency in _FX_CACHE:
        return _FX_CACHE[currency]
    try:
        fx = get_ticker(f"{currency}=X")
        info = fx.info
        rate = _num(info, "regularMarketPrice", "bid", "ask")
        rate = float(rate) if rate else 1.0
    except Exception:
        logger.exception("failed to fetch FX rate for %s", currency)
        rate = 1.0
    _FX_CACHE[currency] = rate
    return rate


def fetch_competitor_snapshot(symbol: str) -> dict:
    """Lightweight snapshot for the competitor comparison table. Market cap
    is normalized to USD; EPS is derived from price/PE when Yahoo omits it."""
    t = get_ticker(symbol)
    try:
        info = t.info
    except Exception as e:
        raise TickerNotFound(symbol) from e

    price = _num(info, "currentPrice", "regularMarketPrice")
    if price is None:
        raise TickerNotFound(symbol)

    currency = info.get("currency") or "USD"
    market_cap_native = _num(info, "marketCap")
    rate = fx_rate_to_usd(currency)
    market_cap_usd = market_cap_native / rate if market_cap_native else None

    pe = _num(info, "trailingPE", "forwardPE")
    eps = _num(info, "trailingEps")
    if eps is None and pe:
        eps = round(price / pe, 4)

    return {
        "ticker": symbol.upper().strip(),
        "name": info.get("longName") or info.get("shortName") or symbol.upper(),
        "currency": currency,
        "price": price,
        "marketCapUsd": market_cap_usd,
        "peRatio": pe,
        "eps": eps,
        "revenueGrowth": _num(info, "revenueGrowth"),
        "profitMargin": _num(info, "profitMargins"),
    }
