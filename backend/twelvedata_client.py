"""Thin wrapper around Twelve Data's free tier for daily OHLC candles.

Neither existing data source in this backend can supply this: Finnhub's
free tier doesn't include historical candles (paid endpoint only), and
Yahoo/yfinance is blocked outright from cloud hosts like Render (see
finnhub_client.py). Twelve Data's free tier includes daily time series,
800 requests/day.

Also covers crypto, same endpoint, same account, just a different symbol
format: Twelve Data wants "SOL/USD", we accept "SOL-USD" from the frontend
(a dash never appears in a real stock ticker in this app) and convert it
here, so the rest of the stack doesn't need to know the difference.
"""
import logging
import os
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://api.twelvedata.com"


class TickerNotFound(Exception):
    pass


def fetch_daily_bars(symbol: str, outputsize: int = 500) -> list:
    """Returns daily bars oldest-first: [{"date", "high", "low", "close"}, ...].
    Raises TickerNotFound for an invalid/unresolvable symbol."""
    symbol = symbol.upper().strip()
    api_symbol = symbol.replace("-", "/")
    resp = requests.get(
        f"{BASE_URL}/time_series",
        params={
            "symbol": api_symbol,
            "interval": "1day",
            "outputsize": outputsize,
            "apikey": os.environ.get("TWELVEDATA_API_KEY", ""),
        },
        timeout=15,
    )
    if resp.status_code in (400, 404):
        raise TickerNotFound(symbol)
    resp.raise_for_status()
    body = resp.json()

    if body.get("status") == "error":
        code = body.get("code")
        if code in (400, 404):
            raise TickerNotFound(symbol)
        raise RuntimeError(f"Twelve Data error {code}: {body.get('message')}")

    values = body.get("values") or []
    if not values:
        raise TickerNotFound(symbol)

    bars = [
        {
            "date": v["datetime"],
            "high": float(v["high"]),
            "low": float(v["low"]),
            "close": float(v["close"]),
        }
        for v in values
    ]
    bars.reverse()  # Twelve Data returns newest-first
    return bars
