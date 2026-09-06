import json
import logging
import os
import re
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

SYSTEM_MESSAGE = """You are a sharp, plain-spoken equity research assistant.
You always answer with a single JSON object and nothing else - no markdown
fences, no commentary before or after. Keep language simple and direct,
never use jargon without briefly explaining it. Be concrete and specific to
the company given, never generic filler."""

RESPONSE_SCHEMA_HINT = """Return ONLY a JSON object with exactly this shape:
{
  "context_catalysts": {
    "business_summary": "2-3 sentences on how the company actually makes money",
    "catalysts": ["catalyst 1", "catalyst 2", "catalyst 3", "catalyst 4"]
  },
  "valuation_growth": {
    "valuation_summary": "2-3 plain-language sentences on whether the stock looks under or overvalued today and why",
    "growth_summary": "1-2 plain-language sentences on its growth potential over the next few years"
  },
  "competitors_risks": {
    "risks": "2-3 sentences on the biggest risks to the business",
    "moat_note": "1-2 sentences on the company's competitive moat versus rivals"
  },
  "competitor_tickers": ["TICK1", "TICK2"]
}
competitor_tickers must be the 2 biggest publicly-traded, same-business
competitors, given as valid Yahoo Finance ticker symbols (not the company
being researched itself). Catalysts must be 12-month-forward and specific."""


def _extract_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


async def generate_research(ticker: str, snapshot: dict) -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("EMERGENT_LLM_KEY", "")
    facts = {
        "ticker": ticker,
        "name": snapshot.get("name"),
        "sector": snapshot.get("sector"),
        "industry": snapshot.get("industry"),
        "price": snapshot.get("price"),
        "marketCap": snapshot.get("marketCap"),
        "peRatio": snapshot.get("peRatio"),
        "forwardPE": snapshot.get("forwardPE"),
        "peg": snapshot.get("peg"),
        "profitMargin": snapshot.get("profitMargin"),
        "revenueGrowth": snapshot.get("revenueGrowth"),
        "earningsGrowth": snapshot.get("earningsGrowth"),
        "beta": snapshot.get("beta"),
        "debtToEquity": snapshot.get("debtToEquity"),
        "dividendYield": snapshot.get("dividendYield"),
    }

    chat = LlmChat(
        api_key=api_key,
        session_id=f"stock-research-{ticker}-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-5")

    prompt = (
        f"Research this stock: {snapshot.get('name')} ({ticker}).\n\n"
        f"Known data (JSON):\n{json.dumps(facts, default=str)}\n\n"
        f"{RESPONSE_SCHEMA_HINT}"
    )

    raw = await chat.send_message(UserMessage(text=prompt))
    try:
        data = _extract_json(raw)
    except Exception:
        logger.error("Failed to parse LLM JSON for %s: %s", ticker, raw)
        raise

    data.setdefault("context_catalysts", {})
    data.setdefault("valuation_growth", {})
    data.setdefault("competitors_risks", {})
    tickers = data.get("competitor_tickers") or []
    data["competitor_tickers"] = [str(tk).upper().strip() for tk in tickers][:2]
    return data
