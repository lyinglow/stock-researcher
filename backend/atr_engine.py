"""The ATR Trend & Range signal engine, shared by any Trading route
regardless of asset class or data source. Only needs a list of
{"date", "high", "low", "close"} bars, oldest first.

Same logic as pinescript/atr_trend_range.pine in the atr-trend-range repo,
and the same defaults we backtested there: ATR(14), 3x macro band, Medium
noise suppression. Always-in-market long/short: every signal both closes
whatever's open and opens the opposite side.
"""

ATR_LEN = 14
MACRO_MULT = 3.0
NOISE_MARGIN = 0.35  # Medium


def _wilder_atr(bars: list, length: int) -> list:
    trs = []
    for i, b in enumerate(bars):
        if i == 0:
            tr = b["high"] - b["low"]
        else:
            pc = bars[i - 1]["close"]
            tr = max(b["high"] - b["low"], abs(b["high"] - pc), abs(b["low"] - pc))
        trs.append(tr)

    atr = [None] * len(bars)
    if len(trs) < length:
        return atr
    atr[length - 1] = sum(trs[:length]) / length
    for i in range(length, len(bars)):
        atr[i] = (atr[i - 1] * (length - 1) + trs[i]) / length
    return atr


def _run_band(bars: list, atr: list, mult: float, margin_mult: float):
    n = len(bars)
    upper_band = [None] * n
    lower_band = [None] * n
    trend = [1] * n
    line = [None] * n

    for i in range(n):
        if atr[i] is None:
            continue
        src = (bars[i]["high"] + bars[i]["low"]) / 2
        upper_basic = src + mult * atr[i]
        lower_basic = src - mult * atr[i]
        prev_upper = upper_band[i - 1] if i > 0 and upper_band[i - 1] is not None else upper_basic
        prev_lower = lower_band[i - 1] if i > 0 and lower_band[i - 1] is not None else lower_basic
        prev_close = bars[i - 1]["close"] if i > 0 else bars[i]["close"]

        upper_band[i] = upper_basic if (upper_basic < prev_upper or prev_close > prev_upper) else prev_upper
        lower_band[i] = lower_basic if (lower_basic > prev_lower or prev_close < prev_lower) else prev_lower

        margin = margin_mult * atr[i]
        prev_trend = trend[i - 1] if i > 0 else 1
        prev_upper_final = upper_band[i - 1] if i > 0 and upper_band[i - 1] is not None else upper_band[i]
        prev_lower_final = lower_band[i - 1] if i > 0 and lower_band[i - 1] is not None else lower_band[i]
        close = bars[i]["close"]

        if prev_trend == -1 and close > prev_upper_final + margin:
            trend[i] = 1
        elif prev_trend == 1 and close < prev_lower_final - margin:
            trend[i] = -1
        else:
            trend[i] = prev_trend

        line[i] = lower_band[i] if trend[i] == 1 else upper_band[i]

    return line, trend


def compute_signal(bars: list, atr_len: int = ATR_LEN, macro_mult: float = MACRO_MULT,
                    noise_margin: float = NOISE_MARGIN) -> dict:
    """bars: oldest-first list of {"date", "high", "low", "close"}."""
    atr = _wilder_atr(bars, atr_len)
    line, trend = _run_band(bars, atr, macro_mult, noise_margin)

    chart_bars = []
    signals = []
    for i, b in enumerate(bars):
        chart_bars.append({
            "date": b["date"],
            "close": b["close"],
            "trendLine": line[i],
            "trend": trend[i] if atr[i] is not None else None,
        })
        if i > 0 and atr[i] is not None and atr[i - 1] is not None:
            if trend[i] == 1 and trend[i - 1] == -1:
                signals.append({"type": "BUY", "date": b["date"], "price": round(b["close"], 2)})
            elif trend[i] == -1 and trend[i - 1] == 1:
                signals.append({"type": "SELL", "date": b["date"], "price": round(b["close"], 2)})

    backtest = _run_backtest(signals, bars[-1]["close"] if bars else None)

    last_valid = next((i for i in range(len(bars) - 1, -1, -1) if atr[i] is not None), None)
    current_trend = "bullish" if last_valid is not None and trend[last_valid] == 1 else "bearish"
    stop_loss = line[last_valid] if last_valid is not None else None

    return {
        "bars": chart_bars,
        "currentTrend": current_trend,
        "stopLoss": round(stop_loss, 2) if stop_loss is not None else None,
        "signals": signals,
        "backtest": backtest,
    }


def _run_backtest(signals: list, last_close) -> dict:
    position_type = None
    entry_price = None
    trades = []
    balance = 1.0
    peak = 1.0
    max_drawdown = 0.0

    for s in signals:
        if position_type is not None:
            pnl = ((s["price"] - entry_price) / entry_price if position_type == "LONG"
                   else (entry_price - s["price"]) / entry_price)
            trades.append(pnl)
            balance *= (1 + pnl)
            peak = max(peak, balance)
            max_drawdown = max(max_drawdown, (peak - balance) / peak)
        position_type = "LONG" if s["type"] == "BUY" else "SHORT"
        entry_price = s["price"]

    open_position = None
    if position_type is not None and last_close is not None:
        open_pnl = ((last_close - entry_price) / entry_price if position_type == "LONG"
                    else (entry_price - last_close) / entry_price)
        final = balance * (1 + open_pnl)
        open_position = position_type.capitalize()
    else:
        final = balance

    peak = max(peak, final)
    max_drawdown = max(max_drawdown, (peak - final) / peak) if peak > 0 else max_drawdown

    wins = sum(1 for p in trades if p > 0)
    return {
        "closedTrades": len(trades),
        "winRatePct": round(wins / len(trades) * 100, 1) if trades else None,
        "returnPct": round((final - 1) * 100, 1),
        "maxDrawdownPct": round(max_drawdown * 100, 1),
        "openPosition": open_position,
    }
