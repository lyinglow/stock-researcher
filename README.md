# Stock Researcher

Look up any stock and get live fundamentals plus a plain-language AI research brief.

## Stack

- **Frontend** — React, Tailwind CSS, Recharts, Framer Motion, Lucide icons
- **Backend** — FastAPI, yfinance, MongoDB (Motor)
- **AI** — Claude (via the Emergent LLM key) for the research brief

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env .env.local   # then fill in EMERGENT_LLM_KEY and MONGO_URL
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
