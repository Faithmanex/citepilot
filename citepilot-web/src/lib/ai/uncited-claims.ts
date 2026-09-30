/**
 * Uncited factual/statistical claim detection.
 * Port of `citepilot-ai/src/citepilot_ai/services/uncited_claims_detector.py`.
 */
import { callGemini, parseAndValidate } from "./llm";
import { UncitedClaimsResponseSchema } from "./schemas";
import type { JsonObject, ParagraphMeta } from "./types";

const UNCITED_CLAIMS_SYSTEM_PROMPT = `You are an expert academic writing auditor and structural analyzer based on Formatly's multi-step document architecture.
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
1. STATEMENTS DESCRIBING THE AUTHOR'S OWN CURRENT STUDY OR METHODOLOGY.
2. STRUCTURAL HEADINGS & TABLE OF CONTENTS LINES.
3. PERSONAL ANECDOTES & AUTOBIOGRAPHICAL REFLECTIONS.
4. DISSERTATION STRUCTURE OVERVIEWS.
5. GENERAL INTRODUCTORY DEFINITIONS OR COMMON KNOWLEDGE CONCEPTS.

═══════════════════════════════════════════════════════
STEP 3 — TARGET SPECIFIC UNATTRIBUTED THIRD-PARTY CLAIMS
═══════════════════════════════════════════════════════
Flag ONLY specific third-party empirical claims, external statistical data/percentages, or historical facts attributed to external literature that lack a citation marker (Author, Year).`;

export async function detectUncitedClaims(
  bodyText: string,
  paragraphsMeta: ParagraphMeta[]
): Promise<JsonObject[]> {
  if (!bodyText || !bodyText.trim()) return [];

  let paras = paragraphsMeta;
  if (!paras || paras.length === 0) {
    const parts = bodyText.split("\n\n");
    paras = parts
      .map((p, i) => ({ paragraph_index: i, text: p.trim() }))
      .filter((p) => p.text);
  }

  const docStructure: Array<{ paragraph_index: number; text: string }> = [];
  let currentCharCount = 0;
  for (let i = 0; i < paras.length; i += 1) {
    const pTxt = (paras[i].text || "").trim().slice(0, 2000);
    if (!pTxt) continue;
    const itemLen = pTxt.length;
    if (currentCharCount + itemLen > 115000) break;
    docStructure.push({
      paragraph_index: paras[i].paragraph_index ?? i,
      text: pTxt,
    });
    currentCharCount += itemLen;
  }

  const payload = JSON.stringify(docStructure);
  const prompt = `Scan the following academic paragraphs and identify ONLY specific external empirical, statistical, or third-party research assertions that lack a citation marker. 

Completely skip and ignore all statements describing the author's own research methodology ("this study draws on..."), Table of Contents headings ("Historical Roots..."), figure captions, personal positionality reflections, and dissertation overviews.

Paragraphs payload:
${payload}

Return JSON with structure:
{
  "uncited_claims": [
    {
      "paragraph_index": 0,
      "claim_text": "the exact sentence or assertion lacking citation",
      "reason": "Specific percentage or empirical finding reported without a supporting reference marker",
      "severity": "warning"
    }
  ]
}`;

  try {
    const raw = await callGemini(prompt, UNCITED_CLAIMS_SYSTEM_PROMPT);
    const validated = parseAndValidate(raw, UncitedClaimsResponseSchema);

    return validated.uncited_claims.map((c) => ({
      code: "UNCITED_FACTUAL_CLAIM",
      category: "citation_needed",
      paragraph_index: c.paragraph_index,
      claim_text: c.claim_text,
      message: `Uncited Claim: '${c.claim_text.slice(0, 80)}...' requires a supporting citation marker.`,
      educational_context:
        "Academic style manuals require backing up empirical claims, statistical data, or specific findings with an explicit in-text reference.",
      suggestion: "Add a supporting in-text citation marker (e.g. Author, Year).",
      severity: "warning",
    }));
  } catch {
    return [];
  }
}
