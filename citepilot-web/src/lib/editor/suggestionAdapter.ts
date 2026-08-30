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
 * Directly transforms an AuditResponse into production EditorSuggestion entities
 * with stable deterministic IDs and accurate span offsets.
 */
export function adaptAuditResponseToSuggestions(
  audit: AuditResponse | null,
  manuscriptText: string
): EditorSuggestion[] {
  if (!audit || !manuscriptText) return [];

  const suggestions: EditorSuggestion[] = [];
  const occupiedSpans: { start: number; end: number }[] = [];

  const isOverlapping = (start: number, end: number) => {
    return occupiedSpans.some(
      (s) => Math.max(s.start, start) < Math.min(s.end, end)
    );
  };

  // 1. Style Warnings -> category: "style"
  const styleWarnings = audit.style_warnings || [];
  styleWarnings.forEach((w: StyleWarning, idx: number) => {
    const target = (w.target_text || "").trim();
    if (!target) return;

    const occurrences = findOccurrences(manuscriptText, target);
    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const originalSnippet = manuscriptText.slice(match.start, match.end);
      const replacementText = w.suggestion || originalSnippet;

      suggestions.push({
        id: `style-${idx}`,
        category: "style",
        fixType: "replace",
        original: originalSnippet,
        replacement: replacementText,
        span: { start: match.start, end: match.end },
        title: w.code ? `Style Rule: ${w.code}` : "Academic Style Alignment",
        explanation: w.message || "Deviation from academic citation style standard detected.",
        educationalContext: w.educational_context,
        ruleCode: w.code,
        severity: "medium",
        impactScore: 6,
        status: "active",
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

  // 2. Citations (Unmatched or Issues) -> category: "citation"
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

      suggestions.push({
        id: `citation-${idx}`,
        category: "citation",
        fixType: "replace",
        original: manuscriptText.slice(match.start, match.end),
        replacement: raw,
        span: { start: match.start, end: match.end },
        title: hasNoMatch ? "Unmatched Citation Reference" : "Citation Format Notice",
        explanation: issueMessage,
        educationalContext: hasNoMatch
          ? "Every citation cited in the manuscript body must correspond to a full entry in the references list."
          : "Standardize citation syntax according to target academic style.",
        ruleCode,
        severity: hasNoMatch ? "high" : "medium",
        impactScore: 10,
        status: "active",
        metadata: {
          ruleCode,
          authors: raw,
          crossrefVerified: false,
          guidelineRef: hasNoMatch
            ? "Every citation cited in the manuscript body must correspond to a full entry in the references list."
            : "Standardize citation syntax according to target academic style.",
        },
      });

      occupiedSpans.push(match);
      break;
    }
  });

  // 3. Uncited Claims -> category: "claim"
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

      suggestions.push({
        id: `claim-${idx}`,
        category: "claim",
        fixType: "insert_placeholder",
        original: snippet,
        replacement: placeholder,
        span: { start: match.start, end: match.end },
        title: "Unsubstantiated Empirical Claim",
        explanation:
          "Empirical assertion, statistical metric, or factual claim made without an accompanying primary citation.",
        educationalContext:
          claim.educational_context ||
          "Factual, historical, or quantitative assertions require authoritative primary citations.",
        severity: "medium",
        impactScore: 8,
        status: "active",
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

  // 4. Retracted References & Discrepancies -> category: "reference"
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

      suggestions.push({
        id: `ref-${idx}`,
        category: "reference",
        fixType: isRetracted ? "replace" : "correct_reference",
        original: fullSnippet,
        replacement: fullSnippet,
        span: { start: match.start, end: endOffset },
        title: isRetracted ? "Retracted Academic Paper Detected" : "Crossref Metadata Discrepancy",
        explanation: isRetracted
          ? "This cited source has been formally retracted in peer-reviewed literature. Remove or contextualize."
          : (ref.crossref_validation?.discrepancies?.[0]?.message || "Metadata discrepancy with Crossref records."),
        educationalContext: isRetracted
          ? "Citing retracted publications compromises academic validity."
          : (ref.crossref_validation?.discrepancies?.[0]?.how_to_fix || "Verify the DOI and author spelling."),
        severity: isRetracted ? "high" : "low",
        impactScore: isRetracted ? 15 : 5,
        status: "active",
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

  return suggestions.sort((a, b) => a.span.start - b.span.start);
}

/**
 * Computes realistic, dynamic rigor metrics based on real suggestions and resolution states.
 */
export function computeRigorMetrics(
  totalSuggestions: EditorSuggestion[],
  audit: AuditResponse | null
): RigorMetrics {
  const total = totalSuggestions.length;
  const resolved = totalSuggestions.filter((s) => s.status !== "active").length;

  if (total === 0) {
    return {
      overallScore: 98,
      totalIssues: 0,
      resolvedIssues: 0,
      citationIntegrity: 100,
      styleCompliance: 100,
      claimVerification: 100,
      referenceReliability: 100,
    };
  }

  // Category breakdowns
  const categoryStats = (cat: EditorSuggestion["category"]) => {
    const items = totalSuggestions.filter((s) => s.category === cat);
    if (items.length === 0) return 100;
    const catResolved = items.filter((s) => s.status !== "active").length;
    const resolvedRatio = catResolved / items.length;
    return Math.min(100, Math.round(60 + resolvedRatio * 40));
  };

  const citationIntegrity = categoryStats("citation");
  const styleCompliance = categoryStats("style");
  const claimVerification = categoryStats("claim");
  const referenceReliability = categoryStats("reference");

  // Dynamic overall score calculation
  const resolutionRatio = resolved / total;
  const baseScore = Math.max(45, 100 - total * 7);
  const overallScore = Math.min(100, Math.round(baseScore + resolutionRatio * (100 - baseScore)));

  return {
    overallScore,
    totalIssues: total,
    resolvedIssues: resolved,
    citationIntegrity,
    styleCompliance,
    claimVerification,
    referenceReliability,
  };
}


