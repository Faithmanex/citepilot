import asyncio
import json
import logging
import re
import time
from typing import Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

from google import genai
from google.genai import types as genai_types

from ..config import settings

logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None


class AIServiceError(Exception):
    """Exception raised when the AI model service is unavailable or unconfigured."""
    pass


FALLBACK_MODELS = [
    settings.gemini_model,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]
# Remove duplicates while preserving order
FALLBACK_MODELS = list(dict.fromkeys(m for m in FALLBACK_MODELS if m))


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.google_api_key:
            raise AIServiceError("GOOGLE_API_KEY is not set. Gemini API requires a valid API key.")
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


def call_gemini(prompt: str, system_instruction: Optional[str] = None, response_schema: Optional[type] = None) -> str:
    """
    Calls Gemini API synchronously with exponential backoff retries and fallback models.
    """
    client = get_client()

    config_args = {
        "temperature": 0.1,
        "top_p": 0.95,
    }
    if system_instruction:
        config_args["system_instruction"] = system_instruction
    if response_schema:
        config_args["response_mime_type"] = "application/json"
        config_args["response_schema"] = response_schema

    config = genai_types.GenerateContentConfig(**config_args)

    last_error = None
    for model_name in FALLBACK_MODELS:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    sleep_time = (2 ** attempt) + 0.5
                    logger.warning(f"Gemini API capacity spike on {model_name} (attempt {attempt+1}/3). Retrying in {sleep_time}s... Error: {e}")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Gemini API error on {model_name}: {e}")
                    break

    logger.error(f"All Gemini retries failed. Last error: {last_error}")
    raise AIServiceError(f"Gemini API execution failed across all candidate models. Last error: {last_error}")


async def async_call_gemini(prompt: str, system_instruction: Optional[str] = None, response_schema: Optional[type] = None) -> str:
    """
    Asynchronously invokes call_gemini using asyncio.to_thread to prevent blocking the event loop.
    """
    return await asyncio.to_thread(call_gemini, prompt, system_instruction, response_schema)


def extract_json(text: str) -> dict:
    """Extracts JSON dictionary safely from LLM output."""
    if not text:
        return {}

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    return {}


TypeVar_T = TypeVar("TypeVar_T", bound=BaseModel)


def parse_and_validate_ai_response(raw_text: str, schema_model: Type[TypeVar_T]) -> TypeVar_T:
    """
    Safely extracts JSON from raw LLM output and validates it against a Pydantic schema model.
    Returns a validated Pydantic model instance. If validation fails or json parsing yields empty,
    returns a default instance of schema_model and logs detailed validation warnings.
    """
    raw_dict = extract_json(raw_text)
    try:
        return schema_model.model_validate(raw_dict)
    except ValidationError as ve:
        logger.warning(f"Pydantic schema validation warning for {schema_model.__name__}: {ve}")
        try:
            return schema_model()
        except Exception:
            raise ve
    except Exception as e:
        logger.error(f"Unexpected error during schema validation for {schema_model.__name__}: {e}")
        return schema_model()

