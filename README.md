# Stock Researcher

Look up any stock and get live fundamentals plus a plain-language AI research brief.
A second tab, Trading, runs an ATR-based trend and range signal against the same
ticker: current trend, stop loss, buy/sell history, and a backtest.

## Stack

- **Frontend** — React, Tailwind CSS, Recharts, Framer Motion, Lucide icons
- **Backend** — FastAPI
- **Data** — Finnhub (fundamentals, quote), Twelve Data (daily OHLC for the
  Trading tab)
- **AI** — Claude, for the research brief

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
cp .env.example .env   # then fill in ANTHROPIC_API_KEY, FINNHUB_API_KEY, TWELVEDATA_API_KEY
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend reads `REACT_APP_BACKEND_URL` from `frontend/.env` and calls every
backend route under `/api`.

## API

- `GET /api/stock/{ticker}` — live snapshot: price, 52-week range, market cap,
  sector, valuation and growth metrics, analyst ratings, 1-year price history.
  Returns 404 for an invalid ticker.
- `POST /api/research` — `{ ticker }` → an AI-generated brief (business
  summary, catalysts, valuation read, risks, moat note) plus two competitor
  tickers.
- `POST /api/competitors` — `{ ticker, tickers? }` → USD-normalized snapshots
  for side-by-side comparison. Pass `tickers` to skip the AI lookup.
- `GET /api/trading/{ticker}` — ATR trend and range signal: daily bars with
  the trend line, current trend, stop loss, full buy/sell signal history,
  and a backtest (win rate, return, max drawdown, current open position).
  Returns 404 for an invalid ticker.

## Deploying (Render)

This repo includes a `render.yaml` blueprint that provisions the backend as a
web service and the frontend as a static site.

1. **Render** — sign in at [render.com](https://render.com), New → Blueprint,
   connect this repo. Render reads `render.yaml` and creates both services.
2. When prompted for environment variables, set on `stock-researcher-api`:
   - `ANTHROPIC_API_KEY` — your key from
     [console.anthropic.com](https://console.anthropic.com)
   - `FINNHUB_API_KEY` — your key from [finnhub.io](https://finnhub.io)
   - `TWELVEDATA_API_KEY` — your key from
     [twelvedata.com](https://twelvedata.com), free tier is enough to start
   - `REDIS_URL` — optional but recommended, without it caching falls back
     to in-memory only and resets whenever the free-tier service sleeps
3. Deploy. Once both services are live, open the static site's URL — that's
   your app.
5. `CORS_ORIGINS` and `REACT_APP_BACKEND_URL` are wired between the two
   services automatically in the blueprint. If either service can't reach the
   other after the first deploy, set the missing one manually in that
   service's Environment tab to the other service's `https://...onrender.com`
   URL, then trigger a manual redeploy.

Every push to `main` after that redeploys both services automatically.
