import type { AuditResponse, Citation, StyleWarning, UncitedClaim, Reference } from "@/lib/types";
import type { DemoSuggestion } from "@/components/landing/demo/types";
import type { EditorSuggestion, RigorMetrics } from "./types";

/**
 * Finds all non-overlapping occurrences of a needle within a haystack string.
 */
function findOccurrences(haystack: string, needle: string): { start: number; end: number }[] {
  if (!needle || !haystack) return [];
  const results: { start: number; end: number }[] = [];
  let startIndex = 0;
  const needleLower = needle.toLowerCase();
  const haystackLower = haystack.toLowerCase();

  while (startIndex < haystack.length) {
    const idx = haystackLower.indexOf(needleLower, startIndex);
    if (idx === -1) break;
    results.push({ start: idx, end: idx + needle.length });
    startIndex = idx + Math.max(1, needle.length);
  }
  return results;
}

/**
 * Transforms an AuditResponse into canonical DemoSuggestion entities
 * compatible with the Landing Page Demo Editor components.
 */
export function adaptAuditResponseToDemoSuggestions(
  audit: AuditResponse | null,
  manuscriptText: string
): DemoSuggestion[] {
  if (!audit || !manuscriptText) return [];

  const rawSuggestions: DemoSuggestion[] = [];
  const occupiedSpans: { start: number; end: number }[] = [];

  const isOverlapping = (start: number, end: number) => {
    return occupiedSpans.some(
      (s) => Math.max(s.start, start) < Math.min(s.end, end)
    );
  };

  // 1. Style Warnings -> category: "tone-clarity"
  const styleWarnings = audit.style_warnings || [];
  styleWarnings.forEach((w: StyleWarning, idx: number) => {
    const target = (w.target_text || "").trim();
    if (!target) return;

    const occurrences = findOccurrences(manuscriptText, target);
    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const originalSnippet = manuscriptText.slice(match.start, match.end);
      const replacementText = w.suggestion || originalSnippet;

      rawSuggestions.push({
        id: `style-${idx}-${match.start}`,
        category: "tone-clarity",
        title: w.code ? `Style Rule: ${w.code}` : "Academic Style Alignment",
        rationale: w.message || "Deviation from academic citation style standard detected.",
        originalText: originalSnippet,
        replacementText: replacementText,
        status: "pending",
        startIndex: match.start,
        endIndex: match.end,
        impactScore: 6,
        metadata: {
          ruleCode: w.code,
          guidelineRef: w.educational_context,
          citationStyle: "APA 7",
        },
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 2. Citations (Unmatched or Issues) -> category: "missing-citation"
  const citations = audit.citations || [];
  citations.forEach((c: Citation, idx: number) => {
    const raw = (c.raw_text || "").trim();
    if (!raw) return;

    const hasNoMatch = c.status === "no_match";
    const hasIssues = c.issues && c.issues.length > 0;
    if (!hasNoMatch && !hasIssues) return;

    const occurrences = findOccurrences(manuscriptText, raw);
    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const issueMessage =
        c.issues?.[0]?.message ||
        (hasNoMatch ? "Citation not found in reference list." : "Citation formatting anomaly.");
      const ruleCode = c.issues?.[0]?.code || (hasNoMatch ? "UNMATCHED_CITATION" : "CITATION_STYLE");

      rawSuggestions.push({
        id: `citation-${idx}-${match.start}`,
        category: "missing-citation",
        title: hasNoMatch ? "Unmatched Citation Reference" : "Citation Format Notice",
        rationale: issueMessage,
        originalText: manuscriptText.slice(match.start, match.end),
        replacementText: raw,
        status: "pending",
        startIndex: match.start,
        endIndex: match.end,
        impactScore: 10,
        metadata: {
          ruleCode,
          authors: raw,
          crossrefVerified: false,
          guidelineRef: hasNoMatch
            ? "Every citation cited in the manuscript body must correspond to a full entry in the references list."
            : "Standardize citation syntax according to APA 7th edition.",
        },
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 3. Uncited Claims -> category: "claim-needs-source"
  const claims = audit.uncited_claims || [];
  claims.forEach((claim: UncitedClaim, idx: number) => {
    const target = (claim.claim_text || "").trim();
    if (!target) return;

    const searchTarget = target.length > 80 ? target.slice(0, 80) : target;
    const occurrences = findOccurrences(manuscriptText, searchTarget);

    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const snippet = manuscriptText.slice(match.start, match.end);
      const placeholder = `${snippet} [citation needed]`;

      rawSuggestions.push({
        id: `claim-${idx}-${match.start}`,
        category: "claim-needs-source",
        title: "Unsubstantiated Empirical Claim",
        rationale:
          "Empirical assertion, statistical metric, or factual claim made without an accompanying primary citation.",
        originalText: snippet,
        replacementText: placeholder,
        status: "pending",
        startIndex: match.start,
        endIndex: match.end,
        impactScore: 8,
        metadata: {
          guidelineRef:
            claim.educational_context ||
            "Factual, historical, or quantitative assertions require authoritative primary citations.",
        },
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 4. Retracted References & Discrepancies -> category: "outdated-reference"
  const references = audit.references || [];
  references.forEach((ref: Reference, idx: number) => {
    const raw = (ref.raw_entry || "").trim();
    if (!raw) return;

    const isRetracted = ref.status === "retracted" || Boolean(ref.retraction_info);
    const hasDiscrepancies = Boolean(ref.crossref_validation?.discrepancies?.length);
    if (!isRetracted && !hasDiscrepancies) return;

    const occurrences = findOccurrences(manuscriptText, raw.slice(0, 60));
    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const fullSnippet = manuscriptText.slice(match.start, match.start + raw.length);
      const endOffset = Math.min(manuscriptText.length, match.start + raw.length);

      rawSuggestions.push({
        id: `ref-${idx}-${match.start}`,
        category: "outdated-reference",
        title: isRetracted ? "Retracted Academic Paper Detected" : "Crossref Metadata Discrepancy",
        rationale: isRetracted
          ? "This cited source has been formally retracted in peer-reviewed literature. Remove or contextualize."
          : (ref.crossref_validation?.discrepancies?.[0]?.message || "Metadata discrepancy with Crossref records."),
        originalText: fullSnippet,
        replacementText: fullSnippet,
        status: "pending",
        startIndex: match.start,
        endIndex: endOffset,
        impactScore: isRetracted ? 15 : 5,
        metadata: {
          doi: ref.parsed_doi,
          crossrefVerified: ref.crossref_validation?.crossref_verified,
          guidelineRef: isRetracted
            ? "Citing retracted publications compromises academic validity."
            : (ref.crossref_validation?.discrepancies?.[0]?.how_to_fix || "Verify the DOI and author spelling."),
        },
      });

      occupiedSpans.push({ start: match.start, end: endOffset });
      break;
    }
  });

  return rawSuggestions.sort((a, b) => a.startIndex - b.startIndex);
}

// Conversion helpers between DemoSuggestion (Landing Demo UI) and EditorSuggestion
export function demoToEditorSuggestion(d: DemoSuggestion): EditorSuggestion {
  const categoryMap: Record<string, "citation" | "style" | "claim" | "reference"> = {
    "missing-citation": "citation",
    "claim-needs-source": "claim",
    "outdated-reference": "reference",
    "tone-clarity": "style",
  };
  return {
    id: d.id,
    category: categoryMap[d.category] || "style",
    fixType: d.category === "claim-needs-source" ? "insert_placeholder" : "replace",
    original: d.originalText,
    replacement: d.replacementText,
    span: { start: d.startIndex, end: d.endIndex },
    title: d.title,
    explanation: d.rationale,
    educationalContext: d.metadata?.guidelineRef,
    ruleCode: d.metadata?.ruleCode,
    severity: "medium",
    impactScore: d.impactScore,
    status: d.status === "pending" ? "active" : d.status,
  };
}

export function adaptAuditResponseToSuggestions(
  audit: AuditResponse | null,
  manuscriptText: string
): EditorSuggestion[] {
  const demoSuggestions = adaptAuditResponseToDemoSuggestions(audit, manuscriptText);
  return demoSuggestions.map(demoToEditorSuggestion);
}

export function computeRigorMetrics(
  totalSuggestions: EditorSuggestion[],
  audit: AuditResponse | null
): RigorMetrics {
  const total = totalSuggestions.length;
  const resolved = totalSuggestions.filter((s) => s.status !== "active").length;
  const citationIntegrity = Math.max(20, 100 - total * 10);
  return {
    overallScore: Math.max(30, 100 - (total - resolved) * 8),
    totalIssues: total,
    resolvedIssues: resolved,
    citationIntegrity,
    styleCompliance: citationIntegrity,
    claimVerification: citationIntegrity,
    referenceReliability: citationIntegrity,
  };
}


