import json
import logging
from typing import Dict, List

from .llm import async_call_gemini, extract_json

logger = logging.getLogger(__name__)

UNCITED_CLAIMS_SYSTEM_PROMPT = """You are an expert academic writing auditor and structural analyzer based on Formatly's multi-step document architecture.
Your task is to analyze document paragraphs and identify ONLY specific third-party empirical findings, external statistical assertions, or historical claims that require an external citation marker but lack one.

═══════════════════════════════════════════════════════
STEP 1 — UNDERSTAND SECTION CONTEXT BEFORE EVALUATING
═══════════════════════════════════════════════════════
Before evaluating whether a sentence requires an in-text citation, determine its structural role in the document:
• Abstract summaries & study research design (the author describing their own current study).
• Table of Contents lines, Chapter Titles, Section Headings, Subheadings.
• Figure Captions, Table Titles, List of Tables/Figures.
• Autobiographical positionality statements, author personal background, or dissertation structure summaries.

═══════════════════════════════════════════════════════
STEP 2 — STRICT CONTEXTUAL EXCLUSIONS
═══════════════════════════════════════════════════════
DO NOT FLAG THE FOLLOWING AS UNCITED CLAIMS UNDER ANY CIRCUMSTANCES:
1. STATEMENTS DESCRIBING THE AUTHOR'S OWN CURRENT STUDY OR METHODOLOGY:
   - e.g. "Framed through the koshas... this study draws on in-depth phenomenological interviews with four full-time international school educators."
   - e.g. "My research investigates how regular yoga practice shapes teachers' well-being..."
2. STRUCTURAL HEADINGS & TABLE OF CONTENTS LINES:
   - e.g. "Historical Roots of Embodied Pedagogy: Humanistic, Transpersonal, and Critical Expansions"
   - e.g. "Chapter 1: Embodied Teaching and the Rationale for Research..."
   - e.g. "Organization of Dissertation...", "Reclaiming the Body in Education..."
3. PERSONAL ANECDOTES & AUTOBIOGRAPHICAL REFLECTIONS:
   - e.g. "I grew up in India, where yoga was a natural and integral part...", "In 2007, I delved into my first teacher training..."
4. DISSERTATION STRUCTURE OVERVIEWS:
   - e.g. "This dissertation is structured across seven chapters. Chapter Two outlines..."
5. GENERAL INTRODUCTORY DEFINITIONS OR COMMON KNOWLEDGE CONCEPTS.

═══════════════════════════════════════════════════════
STEP 3 — TARGET SPECIFIC UNATTRIBUTED THIRD-PARTY CLAIMS
═══════════════════════════════════════════════════════
Flag ONLY specific third-party empirical claims, external statistical data/percentages, or historical facts attributed to external literature that lack a citation marker (Author, Year)."""


async def detect_uncited_claims(body_text: str, paragraphs_meta: List[Dict]) -> List[Dict]:
    """
    Scans body text paragraphs to detect factual or statistical assertions that require a citation marker.
    Processes all paragraphs without hardcoded slice limits.
    """
    if not body_text or not body_text.strip():
        return []

    paras = paragraphs_meta
    if not paras:
        parts = body_text.split("\n\n")
        paras = [{"paragraph_index": i, "text": p.strip()} for i, p in enumerate(parts) if p.strip()]

    payload = json.dumps([{
        "paragraph_index": p.get("paragraph_index", i),
        "text": p.get("text", "")[:2000]
    } for i, p in enumerate(paras)], ensure_ascii=False)

    if len(payload) > 120000:
        payload = payload[:120000] + "...[TRUNCATED]"

    prompt = f"""Scan the following academic paragraphs and identify ONLY specific external empirical, statistical, or third-party research assertions that lack a citation marker. 

Completely skip and ignore all statements describing the author's own research methodology ("this study draws on..."), Table of Contents headings ("Historical Roots..."), figure captions, personal positionality reflections, and dissertation overviews.

Paragraphs payload:
{payload}

Return JSON with structure:
{{
  "uncited_claims": [
    {{
      "paragraph_index": 0,
      "claim_text": "the exact sentence or assertion lacking citation",
      "reason": "Specific percentage or empirical finding reported without a supporting reference marker",
      "severity": "warning"
    }}
  ]
}}"""

    try:
        raw = await async_call_gemini(prompt, system_instruction=UNCITED_CLAIMS_SYSTEM_PROMPT)
        logger.debug("AI RAW RESPONSE [UNCITED CLAIMS DETECTOR]: %s", raw)

        res = extract_json(raw)
        claims = res.get("uncited_claims", [])

        enriched = []
        for c in claims:
            enriched.append({
                "code": "UNCITED_FACTUAL_CLAIM",
                "category": "citation_needed",
                "paragraph_index": c.get("paragraph_index", 0),
                "claim_text": c.get("claim_text", ""),
                "message": f"Uncited Claim: '{c.get('claim_text', '')[:80]}...' requires a supporting citation marker.",
                "educational_context": "Academic style manuals require backing up empirical claims, statistical data, or specific findings with an explicit in-text reference.",
                "suggestion": "Add a supporting in-text citation marker (e.g. Author, Year).",
                "severity": "warning"
            })
        return enriched
    except Exception as e:
        logger.error(f"Error detecting uncited claims: {e}")
        return []
