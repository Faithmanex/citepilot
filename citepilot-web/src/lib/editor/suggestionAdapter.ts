import type { AuditResponse, Citation, StyleWarning, UncitedClaim, Reference } from "@/lib/types";
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
 * Transforms an AuditResponse from the AI audit engine into unified, actionable EditorSuggestions
 * with exact character offsets in the manuscript text.
 */
export function adaptAuditResponseToSuggestions(
  audit: AuditResponse | null,
  manuscriptText: string
): EditorSuggestion[] {
  if (!audit || !manuscriptText) return [];

  const rawSuggestions: EditorSuggestion[] = [];
  const occupiedSpans: { start: number; end: number }[] = [];

  const isOverlapping = (start: number, end: number) => {
    return occupiedSpans.some(
      (s) => Math.max(s.start, start) < Math.min(s.end, end)
    );
  };

  // 1. Process Style Warnings (highest priority for 1-click text replacements)
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
        category: "style",
        fixType: "replace",
        original: originalSnippet,
        replacement: replacementText,
        span: { start: match.start, end: match.end },
        title: `Style: ${w.code || "Formatting Notice"}`,
        explanation: w.message || "Deviation from academic citation style standard detected.",
        educationalContext: w.educational_context,
        ruleCode: w.code,
        severity: w.code?.includes("CRITICAL") ? "high" : "medium",
        impactScore: 6,
        status: "active",
      });

      occupiedSpans.push(match);
      break; // Map to the first valid non-overlapping occurrence
    }
  });

  // 2. Process Citations with issues or no reference list match
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

      const issueMessage = c.issues?.[0]?.message || (hasNoMatch ? "Citation not found in reference list." : "Citation formatting anomaly.");
      const ruleCode = c.issues?.[0]?.code || (hasNoMatch ? "UNMATCHED_CITATION" : "CITATION_STYLE");

      rawSuggestions.push({
        id: `citation-${idx}-${match.start}`,
        category: "citation",
        fixType: "replace",
        original: manuscriptText.slice(match.start, match.end),
        replacement: raw,
        span: { start: match.start, end: match.end },
        title: hasNoMatch ? "Orphaned In-Text Citation" : "Citation Format Notice",
        explanation: issueMessage,
        educationalContext: hasNoMatch
          ? "Every citation cited in the manuscript body must correspond to a full entry in the references list."
          : "Standardize citation syntax according to APA 7th edition.",
        ruleCode,
        severity: hasNoMatch ? "high" : "medium",
        impactScore: hasNoMatch ? 10 : 5,
        status: "active",
        paragraphIndex: c.paragraph_index,
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 3. Process Uncited Claims
  const claims = audit.uncited_claims || [];
  claims.forEach((claim: UncitedClaim, idx: number) => {
    const target = (claim.claim_text || "").trim();
    if (!target) return;

    // Search for full or first 80 chars of claim if truncated
    const searchTarget = target.length > 80 ? target.slice(0, 80) : target;
    const occurrences = findOccurrences(manuscriptText, searchTarget);

    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const snippet = manuscriptText.slice(match.start, match.end);
      const placeholder = `${snippet} [citation needed]`;

      rawSuggestions.push({
        id: `claim-${idx}-${match.start}`,
        category: "claim",
        fixType: "insert_placeholder",
        original: snippet,
        replacement: placeholder,
        span: { start: match.start, end: match.end },
        title: "Unsubstantiated Empirical Claim",
        explanation: "Empirical assertion, statistical metric, or factual claim made without an accompanying citation.",
        educationalContext: claim.educational_context || "Factual, historical, or quantitative assertions require authoritative primary citations.",
        severity: "high",
        impactScore: 8,
        status: "active",
        paragraphIndex: claim.paragraph_index,
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 4. Process References (Retractions & Crossref discrepancies)
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
        category: "reference",
        fixType: "correct_reference",
        original: fullSnippet,
        replacement: fullSnippet,
        span: { start: match.start, end: endOffset },
        title: isRetracted ? "Retracted Academic Paper Detected" : "Crossref Metadata Discrepancy",
        explanation: isRetracted
          ? "This cited source has been formally retracted in peer-reviewed literature. Remove or contextualize."
          : (ref.crossref_validation?.discrepancies?.[0]?.message || "Metadata discrepancy with Crossref records."),
        educationalContext: isRetracted
          ? "Citing retracted publications compromises academic validity unless discussing the retraction directly."
          : (ref.crossref_validation?.discrepancies?.[0]?.how_to_fix || "Verify the DOI, author spelling, and publication year."),
        severity: isRetracted ? "high" : "low",
        impactScore: isRetracted ? 15 : 4,
        status: "active",
      });

      occupiedSpans.push({ start: match.start, end: endOffset });
      break;
    }
  });

  // Sort by starting character offset in the document
  return rawSuggestions.sort((a, b) => a.span.start - b.span.start);
}

/**
 * Computes live Rigor Metrics from suggestions and audit status
 */
export function computeRigorMetrics(
  totalSuggestions: EditorSuggestion[],
  audit: AuditResponse | null
): RigorMetrics {
  const total = totalSuggestions.length;
  const resolved = totalSuggestions.filter((s) => s.status !== "active").length;
  const active = totalSuggestions.filter((s) => s.status === "active");

  const activeCitations = active.filter((s) => s.category === "citation").length;
  const activeStyle = active.filter((s) => s.category === "style").length;
  const activeClaims = active.filter((s) => s.category === "claim").length;
  const activeRefs = active.filter((s) => s.category === "reference").length;

  // Base score calculation: 100 minus active penalties
  const citationIntegrity = Math.max(10, 100 - activeCitations * 12);
  const styleCompliance = Math.max(15, 100 - activeStyle * 8);
  const claimVerification = Math.max(10, 100 - activeClaims * 14);
  const referenceReliability = Math.max(20, 100 - activeRefs * 15);

  const weightedScore = Math.round(
    citationIntegrity * 0.35 +
    styleCompliance * 0.25 +
    claimVerification * 0.25 +
    referenceReliability * 0.15
  );

  return {
    overallScore: Math.min(100, Math.max(0, weightedScore)),
    totalIssues: total,
    resolvedIssues: resolved,
    citationIntegrity,
    styleCompliance,
    claimVerification,
    referenceReliability,
  };
}
