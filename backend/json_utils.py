import json
import re


def extract_json(text: str) -> dict:
    """Pull a JSON object out of an LLM response, tolerating markdown fences
    and any stray text before/after the object."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)
