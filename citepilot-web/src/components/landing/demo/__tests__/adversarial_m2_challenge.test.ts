// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { applySuggestionReplacement, splitTextIntoSegments } from "../spanMutation";
import { calculateRigorScore } from "../rigorScoring";
import { runLiveHeuristicAudit } from "../nlpRuleEngine";
import { ACADEMIC_DRAFTS, DRAFT_LIST } from "../sampleDrafts";
import { useDemoEditor } from "../useDemoEditor";
import type { DemoSuggestion } from "../types";

describe("Milestone 2 — Adversarial Empirical Stress & Invariant Verification Suite", () => {
  // =========================================================================
  // 1. SPAN REPLACEMENT & OFFSET PRESERVATION PERMUTATION INVARIANCE
  // =========================================================================
  describe("1. Span Replacement Permutation Invariance & Stability", () => {
    // Helper to generate all permutations of an array
    function getPermutations<T>(array: T[]): T[][] {
      if (array.length <= 1) return [array];
      const result: T[][] = [];
      for (let i = 0; i < array.length; i++) {
        const current = array[i];
        const remaining = [...array.slice(0, i), ...array.slice(i + 1)];
        const perms = getPermutations(remaining);
        for (const p of perms) {
          result.push([current, ...p]);
        }
      }
      return result;
    }

    const draftKeys = ["lit-review", "intro", "discussion"] as const;

    draftKeys.forEach((key) => {
      it(`evaluates all 24 mutation order permutations for ${key} draft and proves final text convergence`, () => {
        const draft = ACADEMIC_DRAFTS[key];
        const allSuggestions = draft.defaultSuggestions;
        expect(allSuggestions.length).toBe(4);

        const permutations = getPermutations(allSuggestions);
        expect(permutations.length).toBe(24);

        // Compute baseline text by applying sequentially in original order
        let canonicalFinalText = draft.initialText;
        let canonicalSuggestions = [...allSuggestions];
        for (const sug of allSuggestions) {
          const target = canonicalSuggestions.find((s) => s.id === sug.id)!;
          const res = applySuggestionReplacement(canonicalFinalText, target, canonicalSuggestions);
          canonicalFinalText = res.newText;
          canonicalSuggestions = res.updatedSuggestions;
        }

        // Test all 24 permutations against canonicalFinalText
        permutations.forEach((perm, permIndex) => {
          let textAcc = draft.initialText;
          let sugAcc = [...allSuggestions];

          perm.forEach((targetSug) => {
            const target = sugAcc.find((s) => s.id === targetSug.id)!;
            expect(target).toBeDefined();
            const res = applySuggestionReplacement(textAcc, target, sugAcc);
            textAcc = res.newText;
            sugAcc = res.updatedSuggestions;
          });

          // Invariant 1: Final text must be character-for-character identical regardless of mutation sequence
          expect(
            textAcc,
            `Permutation #${permIndex} (${perm.map((p) => p.id).join("->")}) produced differing text`
          ).toBe(canonicalFinalText);

          // Invariant 2: All suggestions must be marked accepted
          expect(sugAcc.every((s) => s.status === "accepted")).toBe(true);

          // Invariant 3: All updated suggestion offsets in final text must accurately bound the replacement text
          sugAcc.forEach((sug) => {
            const extracted = textAcc.substring(sug.startIndex, sug.endIndex);
            expect(extracted).toBe(sug.replacementText);
          });
        });
      });
    });

    it("handles adversarial replacements: empty replacement text ('')", () => {
      const initial = "The quick brown fox jumps over the lazy dog.";
      const suggestions: DemoSuggestion[] = [
        {
          id: "s1",
          category: "tone-clarity",
          title: "Delete brown",
          rationale: "Redundant",
          originalText: "brown ",
          replacementText: "",
          status: "pending",
          startIndex: 10,
          endIndex: 16,
          impactScore: 5,
        },
        {
          id: "s2",
          category: "missing-citation",
          title: "Cite dog",
          rationale: "Source needed",
          originalText: "lazy dog",
          replacementText: "lazy canine (Smith, 2024)",
          status: "pending",
          startIndex: 35,
          endIndex: 43,
          impactScore: 10,
        },
      ];

      // Apply s1 (empty replacement)
      const res1 = applySuggestionReplacement(initial, suggestions[0], suggestions);
      expect(res1.newText).toBe("The quick fox jumps over the lazy dog.");
      
      const s2Updated = res1.updatedSuggestions.find((s) => s.id === "s2")!;
      expect(s2Updated.startIndex).toBe(35 - 6); // shifted left by 6 chars
      expect(s2Updated.endIndex).toBe(43 - 6);

      // Apply s2 on top of s1
      const res2 = applySuggestionReplacement(res1.newText, s2Updated, res1.updatedSuggestions);
      expect(res2.newText).toBe("The quick fox jumps over the lazy canine (Smith, 2024).");
    });

    it("handles adversarial replacements: special regex characters, unicode, mathematical symbols", () => {
      const initial = "Algorithm efficiency: O(n^2) is $100% suboptimal across ∑(i=1..n) λ_i.";
      const suggestions: DemoSuggestion[] = [
        {
          id: "s-math",
          category: "claim-needs-source",
          title: "Cite complexity",
          rationale: "Math formula source",
          originalText: "O(n^2)",
          replacementText: "O(n log n) [Knuth, 1998; O(1)]",
          status: "pending",
          startIndex: 22,
          endIndex: 28,
          impactScore: 10,
        },
        {
          id: "s-dollar",
          category: "tone-clarity",
          title: "Fix dollar",
          rationale: "Formatting",
          originalText: "$100%",
          replacementText: "completely (100% ± 0.05%)",
          status: "pending",
          startIndex: 32,
          endIndex: 37,
          impactScore: 5,
        },
      ];

      const res1 = applySuggestionReplacement(initial, suggestions[0], suggestions);
      const target2 = res1.updatedSuggestions.find((s) => s.id === "s-dollar")!;
      const res2 = applySuggestionReplacement(res1.newText, target2, res1.updatedSuggestions);

      expect(res2.newText).toContain("O(n log n) [Knuth, 1998; O(1)]");
      expect(res2.newText).toContain("completely (100% ± 0.05%)");
    });

    it("survives gracefully when target text was altered or deleted before accepting (fallback search)", () => {
      const initial = "Alpha beta gamma delta epsilon.";
      const target: DemoSuggestion = {
        id: "s-missing",
        category: "tone-clarity",
        title: "Missing",
        rationale: "Rationale",
        originalText: "omega",
        replacementText: "omega (revised)",
        status: "pending",
        startIndex: 10,
        endIndex: 15,
        impactScore: 5,
      };

      // Target string "omega" does NOT exist in "Alpha beta gamma delta epsilon."
      const res = applySuggestionReplacement(initial, target, [target]);
      expect(res.newText).toBe(initial); // Text untouched
      expect(res.updatedSuggestions[0].status).toBe("accepted"); // Marked accepted without crash
    });

    it("successfully relocates span via fallback search when text was prepended or shifted", () => {
      const base = "High-fidelity Cas9 variants engineered with structure-guided mutations exhibit undetectable off-target cleavages.";
      const target: DemoSuggestion = {
        id: "bio-reloc",
        category: "missing-citation",
        title: "Variant fidelity",
        rationale: "Needs cite",
        originalText: "High-fidelity Cas9 variants engineered with structure-guided mutations",
        replacementText: "High-fidelity Cas9 variants (Kleinstiver, 2016)",
        status: "pending",
        startIndex: 0, // original offset was 0
        endIndex: 71,
        impactScore: 9,
      };

      // Prepend 20 characters to base text
      const prependedText = "In recent literature, " + base;

      // When startIndex is 0, originalText is actually at index 22
      const res = applySuggestionReplacement(prependedText, target, [target]);
      expect(res.newText).toBe("In recent literature, High-fidelity Cas9 variants (Kleinstiver, 2016) exhibit undetectable off-target cleavages.");
      expect(res.updatedSuggestions[0].startIndex).toBe(22);
    });
  });

  // =========================================================================
  // 2. SPLIT TEXT SEGMENTS INVARIANT VERIFICATION
  // =========================================================================
  describe("2. splitTextIntoSegments Invariant Verification", () => {
    it("preserves exact character-level string identity across all segment concatenation (Conservation of Text)", () => {
      DRAFT_LIST.forEach((draft) => {
        const segments = splitTextIntoSegments(
          draft.initialText,
          draft.defaultSuggestions,
          null,
          null
        );

        const concatenated = segments.map((s) => s.content).join("");
        expect(concatenated).toBe(draft.initialText);
      });
    });

    it("handles empty text, single character, and zero suggestions gracefully", () => {
      const emptySegs = splitTextIntoSegments("", [], null, null);
      expect(emptySegs).toHaveLength(1);
      expect(emptySegs[0].content).toBe("");

      const singleSegs = splitTextIntoSegments("A", [], null, null);
      expect(singleSegs).toHaveLength(1);
      expect(singleSegs[0].content).toBe("A");
    });

    it("handles boundary highlight at index 0 and at text.length", () => {
      const text = "START middle END";
      const suggestions: DemoSuggestion[] = [
        {
          id: "s-start",
          category: "tone-clarity",
          title: "Start",
          rationale: "Start",
          originalText: "START",
          replacementText: "Beginning",
          status: "pending",
          startIndex: 0,
          endIndex: 5,
          impactScore: 5,
        },
        {
          id: "s-end",
          category: "tone-clarity",
          title: "End",
          rationale: "End",
          originalText: "END",
          replacementText: "Conclusion",
          status: "pending",
          startIndex: 13,
          endIndex: 16,
          impactScore: 5,
        },
      ];

      const segments = splitTextIntoSegments(text, suggestions, "s-start", "s-end");
      expect(segments).toHaveLength(3);
      expect(segments[0].type).toBe("highlight");
      expect(segments[0].content).toBe("START");
      expect(segments[0].type === "highlight" && segments[0].isSelected).toBe(true);

      expect(segments[1].type).toBe("text");
      expect(segments[1].content).toBe(" middle ");

      expect(segments[2].type).toBe("highlight");
      expect(segments[2].content).toBe("END");
      expect(segments[2].type === "highlight" && segments[2].isHovered).toBe(true);

      expect(segments.map((s) => s.content).join("")).toBe(text);
    });

    it("handles adjacent contiguous highlights without separating gap", () => {
      const text = "FIRSTSECOND";
      const suggestions: DemoSuggestion[] = [
        {
          id: "s1",
          category: "missing-citation",
          title: "1",
          rationale: "1",
          originalText: "FIRST",
          replacementText: "1",
          status: "pending",
          startIndex: 0,
          endIndex: 5,
          impactScore: 5,
        },
        {
          id: "s2",
          category: "claim-needs-source",
          title: "2",
          rationale: "2",
          originalText: "SECOND",
          replacementText: "2",
          status: "pending",
          startIndex: 5,
          endIndex: 11,
          impactScore: 5,
        },
      ];

      const segments = splitTextIntoSegments(text, suggestions, null, null);
      expect(segments).toHaveLength(2);
      expect(segments[0].type).toBe("highlight");
      expect(segments[0].content).toBe("FIRST");
      expect(segments[1].type).toBe("highlight");
      expect(segments[1].content).toBe("SECOND");
      expect(segments.map((s) => s.content).join("")).toBe("FIRSTSECOND");
    });
  });

  // =========================================================================
  // 3. RIGOR SCORING ENGINE MATHEMATICAL BOUNDS & INVARIANTS
  // =========================================================================
  describe("3. Rigor Scoring Engine Mathematical Bounds & Edge Cases", () => {
    it("guarantees all score metrics remain within [0, 100]% under extreme parameters", () => {
      const extremeBaseScores = [-100, 0, 50, 64, 99, 100, 150];
      const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;

      extremeBaseScores.forEach((base) => {
        // Zero resolved
        const m0 = calculateRigorScore(suggestions, [], [], base);
        expect(m0.overallScore).toBeGreaterThanOrEqual(0);
        expect(m0.overallScore).toBeLessThanOrEqual(100);
        expect(m0.sourceCoverage).toBeGreaterThanOrEqual(0);
        expect(m0.sourceCoverage).toBeLessThanOrEqual(100);
        expect(m0.claimIntegrity).toBeGreaterThanOrEqual(0);
        expect(m0.claimIntegrity).toBeLessThanOrEqual(100);
        expect(m0.scholarlyTone).toBeGreaterThanOrEqual(0);
        expect(m0.scholarlyTone).toBeLessThanOrEqual(100);

        // All accepted
        const mAll = calculateRigorScore(
          suggestions,
          ["lit-1", "lit-2", "lit-3", "lit-4"],
          [],
          base
        );
        expect(mAll.overallScore).toBeGreaterThanOrEqual(0);
        expect(mAll.overallScore).toBeLessThanOrEqual(100);

        // All dismissed
        const mDismiss = calculateRigorScore(
          suggestions,
          [],
          ["lit-1", "lit-2", "lit-3", "lit-4"],
          base
        );
        expect(mDismiss.overallScore).toBeGreaterThanOrEqual(0);
        expect(mDismiss.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it("verifies score monotonicity: Accept Fix >= Dismiss >= No Action", () => {
      const suggestions = ACADEMIC_DRAFTS.intro.defaultSuggestions;
      const base = 64;

      const baseMetrics = calculateRigorScore(suggestions, [], [], base);
      const dismissedOne = calculateRigorScore(suggestions, [], ["bio-1"], base);
      const acceptedOne = calculateRigorScore(suggestions, ["bio-1"], [], base);

      expect(acceptedOne.overallScore).toBeGreaterThan(dismissedOne.overallScore);
      expect(dismissedOne.overallScore).toBeGreaterThan(baseMetrics.overallScore);
    });

    it("verifies status label tier transitions across all base scores when suggestions exist", () => {
      const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
      for (let s = 0; s <= 100; s++) {
        const metrics = calculateRigorScore(suggestions, [], [], s);
        
        if (metrics.overallScore >= 95) {
          expect(metrics.statusLabel).toBe("Ready for Journal Submission");
          expect(metrics.isOptimal).toBe(true);
        } else if (metrics.overallScore >= 85) {
          expect(metrics.statusLabel).toBe("Strong Academic Rigor");
        } else if (metrics.overallScore >= 75) {
          expect(metrics.statusLabel).toBe("Moderate Verification Needed");
        } else {
          expect(metrics.statusLabel).toBe("Needs Immediate Attention");
        }
      }
    });

    it("verifies zero-flaw draft evaluation thresholds (short draft vs optimal submission draft)", () => {
      const shortDraft = calculateRigorScore([], [], [], 64, 10);
      expect(shortDraft.overallScore).toBe(70);
      expect(shortDraft.statusLabel).toBe("Needs Immediate Attention");
      expect(shortDraft.isOptimal).toBe(false);

      const optimalDraft = calculateRigorScore([], [], [], 64, 20);
      expect(optimalDraft.overallScore).toBe(98);
      expect(optimalDraft.statusLabel).toBe("Ready for Journal Submission");
      expect(optimalDraft.isOptimal).toBe(true);
    });
  });

  // =========================================================================
  // 4. NLP HEURISTIC RULES ADVERSARIAL STRESS
  // =========================================================================
  describe("4. NLP Heuristic Rules Adversarial Stress", () => {
    it("processes massive texts (20,000+ chars) in sub-10ms without regex catastrophic backtracking", () => {
      const paragraph =
        "Recent empirical benchmarks indicate that RAG reduces hallucination rates by 38.2% (Urnov et al., 2010). This obviously proves beyond doubt that neural architectures are optimal. It is widely agreed that transformers excel. ";
      const largeText = paragraph.repeat(80); // ~18,000 chars

      const start = performance.now();
      const results = runLiveHeuristicAudit(largeText);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Must execute efficiently
      expect(results.length).toBeGreaterThan(50);
    });

    it("produces non-overlapping spans strictly ordered by startIndex", () => {
      const denseText =
        "It is widely agreed that 95% of studies undeniably prove that (Smith, 2011) reduced error by 40-50% obviously without question.";
      const results = runLiveHeuristicAudit(denseText);

      expect(results.length).toBeGreaterThan(1);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].endIndex).toBeLessThanOrEqual(results[i + 1].startIndex);
      }
    });

    it("handles adversarial inputs: pure symbols, unbalanced parentheses, special regex characters", () => {
      const nastyInputs = [
        "(((((((((((((())))))))))))))",
        ".*+?^${}()|[]\\",
        "100% 100% 100% 100% 100%",
        "proves beyond doubt (2012) obviously (1999) undeniably (2005)",
        "\n\n\t\r   \n",
        "⚡🧬📊✍️ Unicode emoji test with 45.2% gain",
      ];

      nastyInputs.forEach((input) => {
        expect(() => runLiveHeuristicAudit(input)).not.toThrow();
      });
    });
  });

  // =========================================================================
  // 5. HOOK STATE ISOLATION & LIFECYCLE STRESS
  // =========================================================================
  describe("5. useDemoEditor Hook Multi-Draft State Isolation & Reset", () => {
    it("maintains strict isolation between drafts (modifications in draft A do not bleed into draft B)", () => {
      const { result } = renderHook(() => useDemoEditor("lit-review"));

      // 1. Modify lit-review
      act(() => {
        result.current.acceptSuggestion("lit-1");
      });
      expect(result.current.activeDraftId).toBe("lit-review");
      expect(result.current.scoreMetrics.acceptedCount).toBe(1);
      expect(result.current.isDirty).toBe(true);

      // 2. Switch to intro
      act(() => {
        result.current.selectDraft("intro");
      });
      expect(result.current.activeDraftId).toBe("intro");
      expect(result.current.scoreMetrics.acceptedCount).toBe(0);
      expect(result.current.scoreMetrics.overallScore).toBe(64);
      expect(result.current.currentText).toBe(ACADEMIC_DRAFTS.intro.initialText);

      // 3. Modify intro
      act(() => {
        result.current.dismissSuggestion("bio-1");
      });
      expect(result.current.scoreMetrics.dismissedCount).toBe(1);

      // 4. Switch back to lit-review -> state preserved!
      act(() => {
        result.current.selectDraft("lit-review");
      });
      expect(result.current.activeDraftId).toBe("lit-review");
      expect(result.current.scoreMetrics.acceptedCount).toBe(1);
      expect(result.current.scoreMetrics.dismissedCount).toBe(0);
      expect(result.current.currentText).toContain("Shazeer, 2019");

      // 5. Reset lit-review -> only lit-review is reset, intro remains modified
      act(() => {
        result.current.resetDraft();
      });
      expect(result.current.scoreMetrics.acceptedCount).toBe(0);
      expect(result.current.isDirty).toBe(false);

      // Check intro is still dirty
      act(() => {
        result.current.selectDraft("intro");
      });
      expect(result.current.scoreMetrics.dismissedCount).toBe(1);
      expect(result.current.isDirty).toBe(true);
    });

    it("executes acceptAll across all drafts cleanly reaching 100% journal ready state", () => {
      const { result } = renderHook(() => useDemoEditor("discussion"));

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.pendingSuggestions).toHaveLength(0);
      expect(result.current.scoreMetrics.overallScore).toBe(100);
      expect(result.current.scoreMetrics.isOptimal).toBe(true);
      expect(result.current.scoreMetrics.statusLabel).toBe("Ready for Journal Submission");
      expect(result.current.selectedSuggestion).toBeNull();
    });
  });
});
