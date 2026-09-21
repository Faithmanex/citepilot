"""Jev (TypeSafe System One) decision layer — opt-in verification enrichment.

Design notes (see ADR-012):
- Gemini remains the extractor/generator. Jev only answers narrow, typed
  judgments (Choice: supports/contradicts/says_nothing) with calibrated
  confidence, per the TypeSafe `citation_check` cookbook pattern.
- Disabled by default: when `TYPESAFE_API_KEY` is empty (or the SDK is not
  installed), every entry point is a no-op and the pipeline behaves exactly
  as before (fail-open to Gemini-only).
- Never raises: on SDK errors / rate limits / overload, returns an
  error payload so the caller can keep the Gemini verdict.
"""

import asyncio
import logging
from typing import Dict, List, Optional

from ..config import settings

logger = logging.getLogger(__name__)

RELATION_TO_VERDICT = {
    "supports": "verified",
    "contradicts": "contradicted",
    "says_nothing": "unsupported",
}

JEV_QUESTIONS_INSTRUCTIONS = "How does the section relate to the claim?"
JEV_QUESTIONS_CRITERIA = {
    "supports": "The section states the claim or directly implies that it is true",
    "contradicts": "The section states the opposite of the claim or implies it is false",
    "says_nothing": "The section does not address what the claim asserts, either way",
}


def is_jev_enabled() -> bool:
    """True only when the master switch is on AND an API key is configured."""
    return bool(settings.typesafe_enabled and (settings.typesafe_api_key or "").strip())


def build_jev_question_payload() -> Dict:
    """Plain-dict question shape (SDK-agnostic, used for logging/tests)."""
    return {
        "relation": {
            "type": "choice",
            "instructions": JEV_QUESTIONS_INSTRUCTIONS,
            "criteria": dict(JEV_QUESTIONS_CRITERIA),
        }
    }


def _verdict_from_choice(choice: Optional[str], confidence: Optional[float]) -> Dict:
    threshold = settings.typesafe_auto_accept
    if not choice:
        return {"verdict": None, "confidence": confidence, "auto": False}
    return {
        "verdict": RELATION_TO_VERDICT.get(choice),
        "confidence": confidence,
        "auto": bool(confidence is not None and confidence >= threshold),
    }


async def verify_citation_relation(
    claim: str,
    section: str,
    model: Optional[str] = None,
) -> Dict:
    """Verify one claim against one reference section via Jev.

    Returns a dict with keys: enabled, verdict, choice, confidence,
    probabilities, auto, model, error. Never raises.
    """
    if not is_jev_enabled():
        return {"enabled": False, "verdict": None, "auto": False, "error": None}

    if not (claim or "").strip() or not (section or "").strip():
        return {"enabled": True, "verdict": None, "auto": False, "error": "empty claim or section"}

    try:
        from typesafe_sdk import Choice, TypeSafeClient
    except ImportError as e:
        logger.warning("typesafe-sdk not installed; skipping Jev verification: %s", e)
        return {"enabled": True, "verdict": None, "auto": False, "error": "sdk_not_installed"}

    model_name = model or settings.typesafe_model or "jev-latest"
    questions = {
        "relation": Choice(
            instructions=JEV_QUESTIONS_INSTRUCTIONS,
            criteria=dict(JEV_QUESTIONS_CRITERIA),
        )
    }
    state = {"claim": claim, "section": section}

    def _call() -> Dict:
        client = TypeSafeClient(api_key=settings.typesafe_api_key)
        try:
            response = client.system_one(state=state, questions=questions, model=model_name)
        finally:
            try:
                close = getattr(client, "close", None)
                if callable(close):
                    close()
            except Exception:
                pass
        answer = response.answers["relation"]
        return {
            "choice": getattr(answer, "choice", None),
            "confidence": getattr(answer, "confidence", None),
            "probabilities": dict(getattr(answer, "probabilities", {}) or {}),
            "model": getattr(response, "model", model_name),
        }

    try:
        result = await asyncio.to_thread(_call)
    except Exception as e:
        # Fail open: keep the Gemini verdict, record the Jev error for observability.
        logger.warning("Jev verification failed (fail-open to Gemini verdict): %s", e)
        return {"enabled": True, "verdict": None, "auto": False, "error": str(e)[:300]}

    verdict = _verdict_from_choice(result.get("choice"), result.get("confidence"))
    return {
        "enabled": True,
        "verdict": verdict["verdict"],
        "choice": result.get("choice"),
        "confidence": result.get("confidence"),
        "probabilities": result.get("probabilities", {}),
        "auto": verdict["auto"],
        "model": result.get("model", model_name),
        "error": None,
    }


async def enrich_matches_with_jev(
    matches: List[Dict],
    citations: List[Dict],
    references: List[Dict],
    max_chars: int = 8000,
) -> List[Dict]:
    """Attach Jev verdicts to Gemini matches. No-op when Jev is disabled.

    Mutates copies: each match with a valid `matched_reference_index` gains
    `jev_verdict`, `jev_confidence`, `jev_auto`, `jev_choice`, `jev_error`.
    Unmatched or unresolvable matches are returned unchanged.
    """
    if not matches or not is_jev_enabled():
        return matches

    ref_by_pos = {i: r for i, r in enumerate(references)}

    async def _enrich_one(match: Dict) -> Dict:
        idx = match.get("matched_reference_index")
        try:
            idx_int = int(str(idx).strip()) if idx is not None else None
        except (ValueError, TypeError):
            return match
        ref = ref_by_pos.get(idx_int)
        if ref is None:
            return match
        claim = (match.get("citation_raw_text") or "").strip()
        section = (ref.get("raw_entry") or "").strip()[:max_chars]
        if not claim or not section:
            return match
        res = await verify_citation_relation(claim, section)
        if not res.get("enabled"):
            return match
        enriched = dict(match)
        enriched["jev_verdict"] = res.get("verdict")
        enriched["jev_choice"] = res.get("choice")
        enriched["jev_confidence"] = res.get("confidence")
        enriched["jev_auto"] = res.get("auto", False)
        enriched["jev_model"] = res.get("model")
        enriched["jev_error"] = res.get("error")
        return enriched

    results = await asyncio.gather(*(_enrich_one(m) for m in matches))
    return list(results)
