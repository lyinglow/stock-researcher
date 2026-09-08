import logging
import os
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

from json_utils import extract_json

logger = logging.getLogger(__name__)

SYSTEM_MESSAGE = """You are an equity research analyst who tracks where
investor attention is actually building right now, not textbook long-term
trends. You search the web - financial news AND retail-investor discussion
on forums like Reddit (r/stocks, r/investing, r/wallstreetbets) - looking
for investment themes that are being talked about across BOTH sources this
week. A theme is only worth surfacing if you can point to real, recent
evidence for it, not a vague narrative. You always answer with a single
JSON object and nothing else - no markdown fences, no commentary before or
after. Keep language plain and concrete, never vague or generic."""

PROMPT = """Search recent financial news and retail-investor discussion
(Reddit threads on r/stocks, r/investing, r/wallstreetbets and similar) from
the last few days. Identify 3 to 5 investment themes that are currently
gaining attention - a real, specific idea investors are acting on, not a
generic sector label.

For each theme, judge your confidence by how much it's actually backed by
evidence: showing up in multiple news sources AND retail discussion is high
confidence; appearing in only one of the two, or in a single source, is
lower confidence.

Prefer tickers that are US-listed (US companies or US-listed shares of
foreign companies) since that's what this app can look up.

Return ONLY a JSON object with exactly this shape:
{
  "themes": [
    {
      "name": "Short theme name, e.g. 'AI data center power demand'",
      "thesis": "One sentence on the idea itself and why it's investable now.",
      "evidence": "One sentence on what you actually found - what's driving your confidence, or holding it back.",
      "confidence": 1-5,
      "tickers": ["TICK1", "TICK2", "TICK3"]
    }
  ]
}
confidence: 5 means strong, recent, cross-source evidence; 1 means a single
weak mention. tickers: 2 to 4 real, valid US-listed ticker symbols most
exposed to the theme."""


async def generate_themes() -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("EMERGENT_LLM_KEY", "")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"themes-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-5")
    chat.with_tools([{"type": "web_search_20260209", "name": "web_search", "max_uses": 6}])
    chat.with_params(max_tokens=4096)

    response = await chat.send_message_with_tools(UserMessage(text=PROMPT))
    text = response.content or ""
    try:
        data = extract_json(text)
    except Exception:
        logger.error("Failed to parse themes JSON: %s", text)
        raise

    themes = data.get("themes") or []
    cleaned = []
    for item in themes[:5]:
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        try:
            confidence = max(1, min(5, int(item.get("confidence", 3))))
        except (TypeError, ValueError):
            confidence = 3
        tickers = [
            str(t).upper().strip()
            for t in (item.get("tickers") or [])
            if str(t).strip()
        ][:4]
        if not tickers:
            continue
        cleaned.append({
            "name": name,
            "thesis": item.get("thesis") or "",
            "evidence": item.get("evidence") or "",
            "confidence": confidence,
            "tickers": tickers,
        })

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "themes": cleaned,
    }
