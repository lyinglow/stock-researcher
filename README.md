# Stock Researcher

Look up any stock and get live fundamentals plus a plain-language AI research brief.

## Stack

- **Frontend** — React, Tailwind CSS, Recharts, Framer Motion, Lucide icons
- **Backend** — FastAPI, yfinance, MongoDB (Motor)
- **AI** — Claude, for the research brief

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
cp .env.example .env   # then fill in ANTHROPIC_API_KEY and MONGO_URL
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

## Deploying (Render + MongoDB Atlas)

This repo includes a `render.yaml` blueprint that provisions the backend as a
web service and the frontend as a static site.

1. **MongoDB Atlas** (free) — create an account at
   [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), spin up a
   free M0 cluster, add a database user, and allow access from anywhere
   (0.0.0.0/0) under Network Access. Copy the connection string — that's your
   `MONGO_URL`.
2. **Render** — sign in at [render.com](https://render.com), New → Blueprint,
   connect this repo. Render reads `render.yaml` and creates both services.
3. When prompted for environment variables, set on `stock-researcher-api`:
   - `MONGO_URL` — the Atlas connection string from step 1
   - `ANTHROPIC_API_KEY` — your key from
     [console.anthropic.com](https://console.anthropic.com)
4. Deploy. Once both services are live, open the static site's URL — that's
   your app.
5. `CORS_ORIGINS` and `REACT_APP_BACKEND_URL` are wired between the two
   services automatically in the blueprint. If either service can't reach the
   other after the first deploy, set the missing one manually in that
   service's Environment tab to the other service's `https://...onrender.com`
   URL, then trigger a manual redeploy.

Every push to `main` after that redeploys both services automatically.
