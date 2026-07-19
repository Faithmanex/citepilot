import json
import logging
from typing import Optional

from google import genai
from google.genai import types as genai_types

from ..config import settings

logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.google_api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set. Gemini API requires a valid API key.")
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


def call_gemini(prompt: str, system_instruction: Optional[str] = None, response_schema: Optional[type] = None) -> str:
    client = get_client()
    model = settings.gemini_model
    kwargs = {}

    if system_instruction:
        kwargs["config"] = genai_types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0,
            top_p=1.0,
        )
    else:
        kwargs["config"] = genai_types.GenerateContentConfig(
            temperature=0.0,
            top_p=1.0,
        )

    if response_schema:
        kwargs["config"] = genai_types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.0,
            top_p=1.0,
        )

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            **kwargs,
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        raise


def extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3].strip()
    return json.loads(text)
