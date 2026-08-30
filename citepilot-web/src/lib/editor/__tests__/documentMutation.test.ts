import { describe, it, expect } from "vitest";
import {
  applySuggestionMutation,
  buildTextSegments,
  detectAcademicSections,
} from "../documentMutation";
import {
  adaptAuditResponseToSuggestions,
  computeRigorMetrics,
} from "../suggestionAdapter";
import type { EditorSuggestion } from "../types";
import type { AuditResponse } from "@/lib/types";

describe("documentMutation Engine", () => {
  const sampleText =
    "Recent benchmarks indicate that RAG reduces hallucination rates (Urnov et al. 2010). Furthermore, deep learning drives advances.";

  it("applies in-place replacement mutation and accurately shifts subsequent offsets", () => {
    const suggestions: EditorSuggestion[] = [
      {
        id: "s1",
        category: "style",
        fixType: "replace",
        original: "(Urnov et al. 2010)",
        replacement: "(Urnov et al., 2010)",
        span: { start: 64, end: 83 },
        title: "Missing Comma",
        explanation: "Add comma before year",
        severity: "medium",
        impactScore: 5,
        status: "active",
      },
      {
        id: "s2",
        category: "style",
        fixType: "replace",
        original: "deep learning",
        replacement: "deep-learning neural networks",
        span: { start: 98, end: 111 },
        title: "Terminology precision",
        explanation: "Be specific",
        severity: "low",
        impactScore: 4,
        status: "active",
      },
    ];

    const { newText, updatedSuggestions } = applySuggestionMutation(
      sampleText,
      suggestions[0],
      suggestions
    );

    // s1 was replaced: (Urnov et al. 2010) [19 chars] -> (Urnov et al., 2010) [20 chars], delta = +1
    expect(newText).toContain("(Urnov et al., 2010)");
    expect(updatedSuggestions[0].status).toBe("accepted");

    // s2 should have shifted by +1
    expect(updatedSuggestions[1].span.start).toBe(99);
    expect(updatedSuggestions[1].span.end).toBe(112);
    expect(newText.slice(updatedSuggestions[1].span.start, updatedSuggestions[1].span.end)).toBe(
      "deep learning"
    );
  });

  it("safely handles negative delta replacement (shortening text)", () => {
    const text = "Alpha beta gamma delta epsilon.";
    const suggestions: EditorSuggestion[] = [
      {
        id: "s1",
        category: "style",
        fixType: "replace",
        original: "beta gamma",
        replacement: "B",
        span: { start: 6, end: 16 }, // length 10 -> length 1, delta = -9
        title: "Shorten",
        explanation: "Test shortening",
        severity: "low",
        impactScore: 2,
        status: "active",
      },
      {
        id: "s2",
        category: "style",
        fixType: "replace",
        original: "epsilon",
        replacement: "E",
        span: { start: 23, end: 30 },
        title: "Shorten 2",
        explanation: "Test",
        severity: "low",
        impactScore: 2,
        status: "active",
      },
    ];

    const { newText, updatedSuggestions } = applySuggestionMutation(
      text,
      suggestions[0],
      suggestions
    );

    expect(newText).toBe("Alpha B delta epsilon.");
    expect(updatedSuggestions[0].status).toBe("accepted");
    // s2 shifted by -9: 23 - 9 = 14, 30 - 9 = 21
    expect(updatedSuggestions[1].span.start).toBe(14);
    expect(updatedSuggestions[1].span.end).toBe(21);
    expect(newText.slice(14, 21)).toBe("epsilon");
  });

  it("builds continuous text segments covering the complete manuscript length", () => {
    const text = "Prefix [Highlight] Suffix";
    const suggestions: EditorSuggestion[] = [
      {
        id: "hl1",
        category: "citation",
        fixType: "replace",
        original: "[Highlight]",
        replacement: "[Replaced]",
        span: { start: 7, end: 18 },
        title: "Test",
        explanation: "Test",
        severity: "medium",
        impactScore: 5,
        status: "active",
      },
    ];

    const segments = buildTextSegments(text, suggestions, "hl1", null);

    expect(segments.length).toBe(3);
    expect(segments[0].type).toBe("text");
    expect(segments[0].content).toBe("Prefix ");
    expect(segments[1].type).toBe("highlight");
    expect(segments[1].content).toBe("[Highlight]");
    expect(segments[1].isSelected).toBe(true);
    expect(segments[2].type).toBe("text");
    expect(segments[2].content).toBe(" Suffix");

    // Total content matches original text exactly
    const reconstructed = segments.map((s) => s.content).join("");
    expect(reconstructed).toBe(text);
  });

  it("detects academic landmark sections correctly", () => {
    const manuscript = `# Introduction
Here is the introduction.

## Methodology
Here is our method.

Results
Findings are presented here.

References
1. Example ref.`;

    const sections = detectAcademicSections(manuscript);
    expect(sections.length).toBeGreaterThanOrEqual(4);
    expect(sections[0].title).toBe("Introduction");
    expect(sections[1].title).toBe("Methodology");
    expect(sections[2].title).toBe("Results");
    expect(sections[3].title).toBe("References");
  });
});

describe("suggestionAdapter & Rigor Scoring", () => {
  const manuscript = `Abstract
Empirical AI evaluations demonstrate high accuracy (Urnov et al. 2010).
Recent studies prove without doubt that performance doubles annually.

References
Urnov, F. et al. (2010). Genome editing. Nature.`;

  const mockAudit: AuditResponse = {
    citations: [
      {
        raw_text: "(Urnov et al. 2010)",
        status: "no_match",
        issues: [{ code: "UNMATCHED", message: "Not matched in reference list" }],
      },
    ],
    style_warnings: [
      {
        code: "APA7_COMMA",
        message: "Missing comma before year",
        target_text: "(Urnov et al. 2010)",
        suggestion: "(Urnov et al., 2010)",
        educational_context: "APA 7 requires a comma before year.",
      },
    ],
    uncited_claims: [
      {
        claim_text: "Recent studies prove without doubt that performance doubles annually.",
        suggestion: "Add citation to quantitative claim",
        educational_context: "Empirical rate claims require citation.",
      },
    ],
    references: [
      {
        raw_entry: "Urnov, F. et al. (2010). Genome editing. Nature.",
        status: "cited",
        crossref_validation: {
          crossref_verified: false,
          discrepancies: [{ field: "doi", message: "Missing DOI" }],
        },
      },
    ],
  };

  it("adapts AuditResponse directly to EditorSuggestions with accurate offsets and categories", () => {
    const suggestions = adaptAuditResponseToSuggestions(mockAudit, manuscript);

    expect(suggestions.length).toBeGreaterThan(0);

    const styleSuggestion = suggestions.find((s) => s.category === "style");
    expect(styleSuggestion).toBeDefined();
    expect(styleSuggestion?.replacement).toBe("(Urnov et al., 2010)");

    const claimSuggestion = suggestions.find((s) => s.category === "claim");
    expect(claimSuggestion).toBeDefined();
    expect(claimSuggestion?.replacement).toContain("[citation needed]");

    const refSuggestion = suggestions.find((s) => s.category === "reference");
    expect(refSuggestion).toBeDefined();
  });

  it("computes dynamic rigor metrics and updates when suggestions are resolved", () => {
    const suggestions = adaptAuditResponseToSuggestions(mockAudit, manuscript);
    const initialMetrics = computeRigorMetrics(suggestions, mockAudit);

    expect(initialMetrics.totalIssues).toBe(suggestions.length);
    expect(initialMetrics.resolvedIssues).toBe(0);

    // Resolve one suggestion
    const mutatedSuggestions = suggestions.map((s, idx) =>
      idx === 0 ? { ...s, status: "accepted" as const } : s
    );
    const updatedMetrics = computeRigorMetrics(mutatedSuggestions, mockAudit);

    expect(updatedMetrics.resolvedIssues).toBe(1);
    expect(updatedMetrics.overallScore).toBeGreaterThanOrEqual(initialMetrics.overallScore);
  });

});
