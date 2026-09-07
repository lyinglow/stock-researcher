import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import redis.asyncio as redis
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import discover
import llm_research
import yahoo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL", "")
STOCK_CACHE_TTL_SECONDS = 60
RESEARCH_CACHE_TTL_SECONDS = 60 * 60 * 12
DISCOVER_CACHE_TTL_SECONDS = 60 * 60 * 4

redis_client = redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if redis_client:
        await redis_client.aclose()


_memory_cache: dict = {}


async def _cache_get(collection: str, key: str, ttl_seconds: int) -> Optional[dict]:
    """Redis is the real store, since it stays warm across the free web
    service's sleep/restart cycles - the in-memory dict is only a fallback
    for local dev when REDIS_URL isn't set. /api/discover depends on this
    surviving between requests, since it never blocks one on a fresh
    generation."""
    cache_key = f"{collection}:{key}"
    if redis_client:
        try:
            raw = await redis_client.get(cache_key)
            if raw:
                return json.loads(raw)
        except Exception:
            logger.warning("redis read failed for %s, falling back to memory", cache_key)
    entry = _memory_cache.get(cache_key)
    if entry and entry["fetchedAt"] + ttl_seconds > _now():
        return entry["data"]
    return None


async def _cache_set(collection: str, key: str, data: dict, ttl_seconds: int) -> None:
    cache_key = f"{collection}:{key}"
    _memory_cache[cache_key] = {"data": data, "fetchedAt": _now()}
    if redis_client:
        try:
            await redis_client.set(cache_key, json.dumps(data), ex=ttl_seconds)
        except Exception:
            logger.warning("redis write failed for %s, kept in memory only", cache_key)


def _now() -> float:
    return asyncio.get_event_loop().time()


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


async def get_stock_snapshot(ticker: str) -> dict:
    ticker = ticker.upper().strip()
    cached = await _cache_get("stock_cache", ticker, STOCK_CACHE_TTL_SECONDS)
    if cached:
        return cached
    try:
        data = yahoo.fetch_snapshot(ticker)
    except yahoo.TickerNotFound:
        raise
    await _cache_set("stock_cache", ticker, data, STOCK_CACHE_TTL_SECONDS)
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
    cached = await _cache_get("research_cache", ticker, RESEARCH_CACHE_TTL_SECONDS)
    if cached:
        return cached

    try:
        snapshot = await get_stock_snapshot(ticker)
    except yahoo.TickerNotFound:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")

    try:
        research = await llm_research.generate_research(ticker, snapshot)
    except Exception:
        logger.exception("research generation failed for %s", ticker)
        raise HTTPException(status_code=502, detail="Research generation failed, please try again")

    await _cache_set("research_cache", ticker, research, RESEARCH_CACHE_TTL_SECONDS)
    return research


class CompetitorsRequest(BaseModel):
    ticker: str
    tickers: Optional[List[str]] = None


@api.post("/competitors")
async def post_competitors(req: CompetitorsRequest):
    ticker = req.ticker.upper().strip()
    competitor_tickers = [t.upper().strip() for t in (req.tickers or []) if t.strip()]

    if not competitor_tickers:
        cached = await _cache_get("research_cache", ticker, RESEARCH_CACHE_TTL_SECONDS)
        if cached:
            competitor_tickers = cached.get("competitor_tickers", [])
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


DISCOVER_GENERATION_TIMEOUT_SECONDS = 240

_discover_refreshing = False


async def _refresh_discover_cache():
    global _discover_refreshing
    try:
        data = await asyncio.wait_for(
            discover.generate_discoveries(), timeout=DISCOVER_GENERATION_TIMEOUT_SECONDS
        )
        await _cache_set("discover_cache", "latest", data, DISCOVER_CACHE_TTL_SECONDS)
    except asyncio.TimeoutError:
        logger.warning(
            "discover generation exceeded %ss, aborting - will retry on next request",
            DISCOVER_GENERATION_TIMEOUT_SECONDS,
        )
    except Exception:
        logger.exception("background discover refresh failed")
    finally:
        _discover_refreshing = False


@api.get("/discover")
async def get_discover():
    """A fresh generation takes 1-2+ minutes (multiple web searches), far too
    long to block a request on. Serve the cached result when there is one,
    otherwise kick off a background refresh and return a "pending" response
    the frontend polls until it's ready.

    The refreshing flag is checked and set synchronously with no `await`
    between them, so two requests arriving back to back can't both slip
    past the check and launch duplicate (double-cost) generations."""
    global _discover_refreshing
    cached = await _cache_get("discover_cache", "latest", DISCOVER_CACHE_TTL_SECONDS)
    if cached:
        return cached

    if not _discover_refreshing:
        _discover_refreshing = True
        asyncio.create_task(_refresh_discover_cache())

    return {"opportunities": [], "generatedAt": None, "pending": True}


app.include_router(api)
