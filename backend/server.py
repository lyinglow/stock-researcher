import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

import llm_research
import yahoo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "stock_researcher")
STOCK_CACHE_TTL_SECONDS = 60
RESEARCH_CACHE_TTL_SECONDS = 60 * 60 * 12

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    mongo_client.close()


app = FastAPI(title="Stock Researcher API", lifespan=lifespan)
api = APIRouter(prefix="/api")

cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins.split(",")] if cors_origins != "*" else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _fresh(doc: Optional[dict], ttl_seconds: int) -> bool:
    if not doc or "cachedAt" not in doc:
        return False
    cached_at = doc["cachedAt"]
    if isinstance(cached_at, str):
        cached_at = datetime.fromisoformat(cached_at)
    if cached_at.tzinfo is None:
        cached_at = cached_at.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - cached_at).total_seconds() < ttl_seconds


async def get_stock_snapshot(ticker: str) -> dict:
    ticker = ticker.upper().strip()
    cached = await db.stock_cache.find_one({"ticker": ticker}, {"_id": 0})
    if _fresh(cached, STOCK_CACHE_TTL_SECONDS):
        return cached["data"]
    try:
        data = yahoo.fetch_snapshot(ticker)
    except yahoo.TickerNotFound:
        if cached:
            return cached["data"]
        raise
    await db.stock_cache.update_one(
        {"ticker": ticker},
        {"$set": {"ticker": ticker, "data": data, "cachedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return data


@api.get("/health")
async def health():
    return {"status": "ok"}


@api.get("/stock/{ticker}")
async def get_stock(ticker: str):
    try:
        return await get_stock_snapshot(ticker)
    except yahoo.TickerNotFound:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker.upper()}' not found")


class ResearchRequest(BaseModel):
    ticker: str


@api.post("/research")
async def post_research(req: ResearchRequest):
    ticker = req.ticker.upper().strip()
    cached = await db.research_cache.find_one({"ticker": ticker}, {"_id": 0})
    if _fresh(cached, RESEARCH_CACHE_TTL_SECONDS):
        return cached["data"]

    try:
        snapshot = await get_stock_snapshot(ticker)
    except yahoo.TickerNotFound:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")

    try:
        research = await llm_research.generate_research(ticker, snapshot)
    except Exception:
        logger.exception("research generation failed for %s", ticker)
        if cached:
            return cached["data"]
        raise HTTPException(status_code=502, detail="Research generation failed, please try again")

    await db.research_cache.update_one(
        {"ticker": ticker},
        {"$set": {"ticker": ticker, "data": research, "cachedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return research


class CompetitorsRequest(BaseModel):
    ticker: str
    tickers: Optional[List[str]] = None


@api.post("/competitors")
async def post_competitors(req: CompetitorsRequest):
    ticker = req.ticker.upper().strip()
    competitor_tickers = [t.upper().strip() for t in (req.tickers or []) if t.strip()]

    if not competitor_tickers:
        cached = await db.research_cache.find_one({"ticker": ticker}, {"_id": 0})
        if cached:
            competitor_tickers = cached["data"].get("competitor_tickers", [])
        if not competitor_tickers:
            try:
                snapshot = await get_stock_snapshot(ticker)
                research = await llm_research.generate_research(ticker, snapshot)
                competitor_tickers = research.get("competitor_tickers", [])
            except Exception:
                logger.exception("failed to resolve competitors for %s", ticker)

    competitor_tickers = competitor_tickers[:2]

    primary = None
    try:
        primary = yahoo.fetch_competitor_snapshot(ticker)
    except yahoo.TickerNotFound:
        pass

    competitors = []
    for tk in competitor_tickers:
        try:
            competitors.append(yahoo.fetch_competitor_snapshot(tk))
        except yahoo.TickerNotFound:
            logger.warning("competitor ticker not found: %s", tk)

    return {"primary": primary, "competitors": competitors}


app.include_router(api)
