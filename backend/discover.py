import logging
import os
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

from json_utils import extract_json

logger = logging.getLogger(__name__)

SYSTEM_MESSAGE = """You are a sharp equity research scanner. You search the
web for recent, significant business news, then think about which OTHER
public companies are indirectly exposed to that news through supply chain
relationships - suppliers, customers, or direct competitors of the company
the news is actually about. You are not interested in the company making
headlines itself; you are hunting for the second-order names an investor
might not have thought to check yet. You always answer with a single JSON
object and nothing else - no markdown fences, no commentary before or
after. Keep language plain and concrete, never vague or generic."""

PROMPT = """Search for significant business news from the last 2-3 days:
supply chain disruptions, factory or plant incidents, tariffs and trade
policy changes, major contract wins or losses, chip or raw material
shortages, natural disasters affecting production, large M&A, or regulatory
action against a major company.

For each story worth surfacing, identify ONE other publicly traded company
(not the one in the headline) that is plausibly exposed because it is a
supplier to, customer of, or direct competitor of the company in the news.
Prefer tickers that are US-listed (US companies or US-listed shares of
foreign companies) since that's what this app can look up.

Return 5 to 8 of these, ranked by how timely and significant the opportunity
is. Return ONLY a JSON object with exactly this shape:
{
  "opportunities": [
    {
      "ticker": "TICK",
      "name": "Company Name",
      "trigger": "One sentence on the news event itself",
      "connection": "One sentence on why this company is exposed to it",
      "rating": 1-5
    }
  ]
}
rating is how urgent/significant the opportunity looks, 5 being highest.
ticker must be a real, valid, US-listed ticker symbol."""


async def generate_discoveries() -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("EMERGENT_LLM_KEY", "")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"discover-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-5")
    chat.with_tools([{"type": "web_search_20260209", "name": "web_search", "max_uses": 6}])
    chat.with_params(max_tokens=4096)

    response = await chat.send_message_with_tools(UserMessage(text=PROMPT))
    text = response.content or ""
    try:
        data = extract_json(text)
    except Exception:
        logger.error("Failed to parse discover JSON: %s", text)
        raise

    opportunities = data.get("opportunities") or []
    cleaned = []
    for item in opportunities[:8]:
        ticker = str(item.get("ticker", "")).upper().strip()
        if not ticker:
            continue
        try:
            rating = max(1, min(5, int(item.get("rating", 3))))
        except (TypeError, ValueError):
            rating = 3
        cleaned.append({
            "ticker": ticker,
            "name": item.get("name") or ticker,
            "trigger": item.get("trigger") or "",
            "connection": item.get("connection") or "",
            "rating": rating,
        })

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "opportunities": cleaned,
    }
