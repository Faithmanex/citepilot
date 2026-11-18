import type {
  AuditResponse,
  Citation,
  StyleWarning,
  UncitedClaim,
  Reference,
  ProviderValidation,
} from "@/lib/types";
import type { EditorSuggestion, FindingsSummary } from "./types";

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

  // 4. Retracted references, metadata mismatches, and unconfirmed retraction status
  const references = audit.references || [];
  references.forEach((ref: Reference, idx: number) => {
    const raw = (ref.raw_entry || "").trim();
    if (!raw) return;

    const retraction = ref.retraction_info;
    const validation = ref.crossref_validation;
    // An object being present means the check ran, not that the paper was
    // retracted: `normal` and `unknown` both carry one. Only an explicit flag or
    // the retracted status may be reported as a retraction.
    const isRetracted =
      ref.status === "retracted" || retraction?.is_retracted === true;
    // The check ran and produced no answer (no DOI/title, provider failure, or no
    // Crossref record). That is an action for the author, never a clean result —
    // and it must not be dressed up as a retraction finding either.
    const retractionUnconfirmed = !isRetracted && retraction?.status === "unknown";
    const hasDiscrepancies = Boolean(validation?.discrepancies?.length);
    const notFound = !validation?.crossref_verified && validation?.status === "not_found";
    const verificationUnavailable =
      validation?.status === "verification_unavailable";
    // A fallback that failed is the reason a "not found" result is not final.
    // Reporting it only in the aggregate check list would hide which reference
    // the author still has to check by hand.
    const incompleteFallbacks = (
      [
        { label: "OpenAlex", result: ref.openalex_validation },
        { label: "Open Library", result: ref.openlibrary_validation },
      ] as { label: string; result?: ProviderValidation }[]
    ).filter(
      (entry): entry is { label: string; result: ProviderValidation } =>
        entry.result?.status === "verification_unavailable"
    );
    if (
      !isRetracted &&
      !retractionUnconfirmed &&
      !hasDiscrepancies &&
      !notFound &&
      !verificationUnavailable
    )
      return;

    const incompleteFallbackNote = incompleteFallbacks.length
      ? `${incompleteFallbacks.map((f) => f.label).join(" and ")} could not be checked for this reference, so it may still be verifiable elsewhere.`
      : "";
    const incompleteFallbackFixes = incompleteFallbacks
      .map((f) => f.result.how_to_fix)
      .filter((fix): fix is string => Boolean(fix));

    const provider =
      validation?.provider === "openalex"
        ? "OpenAlex"
        : validation?.provider === "openlibrary"
          ? "Open Library"
          : "Crossref";

    const finding = isRetracted
      ? {
          fixType: "replace" as const,
          title: "Retracted Academic Paper Detected",
          explanation:
            retraction?.message ||
            "This cited source has been formally retracted in peer-reviewed literature. Remove or contextualize.",
          educationalContext:
            retraction?.how_to_fix ||
            "Citing retracted publications compromises academic validity.",
          severity: "high" as const,
          impactScore: 15,
        }
      : verificationUnavailable
        ? {
            fixType: "correct_reference" as const,
            title: `Metadata verification not confirmed by ${provider}`,
            explanation: [
              validation?.message ||
                `${provider} could not be reached, so this reference is unverified, not confirmed correct.`,
              // The retraction check may also be unconfirmed for the same
              // reason; say so here instead of implying the source is fine.
              retractionUnconfirmed
                ? retraction?.message ||
                  "Retraction status could not be confirmed either."
                : null,
            ]
              .filter(Boolean)
              .join(" "),
            educationalContext: [
              validation?.how_to_fix ||
                `Retry the audit. If ${provider} stays unavailable, check this reference manually.`,
              retractionUnconfirmed ? retraction?.how_to_fix : null,
              ...incompleteFallbackFixes,
            ]
              .filter(Boolean)
              .join(" "),
            severity: "medium" as const,
            impactScore: 7,
          }
        : notFound
          ? {
              fixType: "correct_reference" as const,
              title: "Reference not found in Crossref",
              explanation:
                (validation?.message ||
                  "Reference metadata could not be found in the Crossref database.") +
                (incompleteFallbackNote ? ` ${incompleteFallbackNote}` : ""),
              educationalContext: [
                validation?.how_to_fix ||
                  "Check the author names, year, and title, or locate the official DOI at doi.org.",
                ...incompleteFallbackFixes,
              ].join(" "),
              severity: "high" as const,
              impactScore: 10,
            }
        : hasDiscrepancies
          ? {
              fixType: "correct_reference" as const,
              title: `Metadata Discrepancy Found in ${provider}`,
              explanation:
                validation?.discrepancies?.[0]?.message ||
                `Metadata discrepancy with ${provider} records.`,
              educationalContext:
                validation?.discrepancies?.[0]?.how_to_fix ||
                "Verify the DOI and author spelling.",
              severity: "low" as const,
              impactScore: 5,
            }
          : {
              fixType: "correct_reference" as const,
              title: "Retraction status not confirmed",
              explanation:
                retraction?.message ||
                "CitePilot could not confirm whether this source has been retracted.",
              educationalContext:
                retraction?.how_to_fix ||
                "Verify the source on the publisher's page before submission; check for retraction or expression-of-concern notices.",
              severity: "medium" as const,
              impactScore: 7,
            };

    const occurrences = findOccurrences(manuscriptText, raw.slice(0, 60));
    for (const match of occurrences) {
      if (isOverlapping(match.start, match.end)) continue;

      const fullSnippet = manuscriptText.slice(match.start, match.start + raw.length);
      const endOffset = Math.min(manuscriptText.length, match.start + raw.length);

      suggestions.push({
        id: `ref-${idx}`,
        category: "reference",
        fixType: finding.fixType,
        original: fullSnippet,
        replacement: fullSnippet,
        span: { start: match.start, end: endOffset },
        title: finding.title,
        explanation: finding.explanation,
        educationalContext: finding.educationalContext,
        severity: finding.severity,
        impactScore: finding.impactScore,
        status: "active",
        metadata: {
          doi: ref.parsed_doi,
          crossrefVerified: validation?.crossref_verified,
          // The author has to act, but not by editing prose: no automated fix
          // can substitute for checking the publisher's record or a provider
          // that never answered.
          actionRequired:
            retraction?.action_required === true || verificationUnavailable,
          guidelineRef: finding.educationalContext,
        },
      });

      occupiedSpans.push({ start: match.start, end: endOffset });
      break;
    }
  });

  return suggestions.sort((a, b) => a.span.start - b.span.start);
}

/**
 * Tallies findings exactly as reported. No score is synthesized: every number
 * here is a count of real findings, and a document with no findings reports no
 * findings rather than an inferred "perfect" score.
 */
export function summarizeFindings(
  suggestions: EditorSuggestion[]
): FindingsSummary {
  const byCategory = { citation: 0, style: 0, claim: 0, reference: 0 };
  let active = 0;
  let resolved = 0;

  for (const suggestion of suggestions) {
    byCategory[suggestion.category] += 1;
    if (suggestion.status === "active") active += 1;
    else resolved += 1;
  }

  return {
    total: suggestions.length,
    active,
    resolved,
    byCategory,
  };
}

