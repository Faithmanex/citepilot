// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { runLiveHeuristicAudit } from "../nlpRuleEngine";
import { calculateRigorScore } from "../scoreCalculator";
import {
  applySuggestionReplacement,
  splitTextIntoSegments,
} from "../spanMutation";
import { useDemoEditor } from "../useDemoEditor";
import { ACADEMIC_DRAFTS } from "../sampleDrafts";
import type { DemoSuggestion } from "../types";

describe("Milestone 2 — Adversarial Stress Test & Verification Suite", () => {
  // =========================================================================
  // 1. NLP REGEX HEURISTIC RULES & CATASTROPHIC BACKTRACKING (ReDoS) STRESS
  // =========================================================================
  describe("1. Adversarial NLP Heuristic Rules & ReDoS Stress Testing", () => {
    it("exhaustively tests all 13 unhedged proof variations in Rule 1 (tone-clarity)", () => {
      const phrases = [
        "proves beyond doubt",
        "proves beyond all doubt",
        "proves beyond any doubt",
        "prove beyond doubt",
        "prove beyond all doubt",
        "prove beyond any doubt",
        "obviously",
        "undeniably",
        "absolutely proves",
        "absolutely prove",
        "absolutely certain",
        "always leads to",
        "completely eliminates all",
        "completely eliminate all",
        "without a shadow of a doubt",
        "undisputed fact",
        "it is crystal clear that",
        "is guaranteed to",
        "without question",
      ];

      phrases.forEach((phrase) => {
        const text = `This experimental finding ${phrase} the hypothesis.`;
        const suggestions = runLiveHeuristicAudit(text);
        const toneSug = suggestions.find((s) => s.category === "tone-clarity");

        expect(
          toneSug,
          `Failed to detect tone issue for phrase: "${phrase}"`
        ).toBeDefined();
        expect(toneSug?.title).toBe("Overly Definitive Phrasing");
        expect(toneSug?.replacementText).toBeDefined();
        expect(toneSug?.replacementText.length).toBeGreaterThan(0);
        expect(toneSug?.replacementText).not.toBe(phrase);
      });
    });

    it("verifies case insensitivity on all heuristic rules", () => {
      const uppercaseText =
        "IT IS WIDELY AGREED THAT THE SYSTEM OBVIOUSLY REDUCES ERRORS BY 45.5% (SMITH, 2012).";
      const suggestions = runLiveHeuristicAudit(uppercaseText);

      expect(suggestions.length).toBe(4);
      const categories = suggestions.map((s) => s.category);
      expect(categories).toContain("missing-citation");
      expect(categories).toContain("tone-clarity");
      expect(categories).toContain("claim-needs-source");
      expect(categories).toContain("outdated-reference");
    });

    it("evaluates diverse statistical percentage formats in Rule 2 (claim-needs-source)", () => {
      const testCases = [
        "reduces error rates by 12%",
        "accuracy gained was 99.8%",
        "saw a 10-20% increase in latency",
        "measured 5.2% of total participants",
        "achieved a 0.05% reduction",
        "yields 100% improvement",
      ];

      testCases.forEach((snippet) => {
        const text = `In our evaluation, the model ${snippet} across benchmarks.`;
        const suggestions = runLiveHeuristicAudit(text);
        const claimSug = suggestions.find(
          (s) => s.category === "claim-needs-source"
        );
        expect(
          claimSug,
          `Failed to detect percentage metric in: "${snippet}"`
        ).toBeDefined();
        expect(claimSug?.replacementText).toContain("Empirical Benchmarks, 2024");
      });
    });

    it("verifies parenthetical lookahead in Rule 2 and Rule 3 (avoids flagging cited stats)", () => {
      // Statistic already inside citation parentheses: should NOT trigger claim-needs-source
      const citedStatText =
        "Previous findings demonstrated notable improvements (Smith et al., 2022; 45% reduction).";
      const suggestions = runLiveHeuristicAudit(citedStatText);
      const claimSug = suggestions.find(
        (s) => s.category === "claim-needs-source"
      );
      expect(claimSug).toBeUndefined();

      // Statistic in regular body prose before a citation: SHOULD trigger
      const uncitedStatText =
        "Our method achieved a 45% reduction in latency (Smith et al., 2022).";
      const uncitedSuggestions = runLiveHeuristicAudit(uncitedStatText);
      const uncitedClaimSug = uncitedSuggestions.find(
        (s) => s.category === "claim-needs-source"
      );
      expect(uncitedClaimSug).toBeDefined();
    });

    it("correctly differentiates pre-2016 outdated references from modern 2016-2026 citations in Rule 4", () => {
      const outdatedCitations = [
        "(Smith, 1999)",
        "(Johnson & Lee, 2004)",
        "(Al Kindi et al., 2010)",
        "(Brown, 2015)",
        "(Turing, 1950)",
      ];

      outdatedCitations.forEach((cite) => {
        const text = `This foundational architecture was introduced in ${cite}.`;
        const suggestions = runLiveHeuristicAudit(text);
        const outdatedSug = suggestions.find(
          (s) => s.category === "outdated-reference"
        );
        expect(
          outdatedSug,
          `Expected ${cite} to be flagged as outdated`
        ).toBeDefined();
        expect(outdatedSug?.replacementText).toContain("2024");
      });

      const modernCitations = [
        "(Vaswani et al., 2017)",
        "(Devlin et al., 2019)",
        "(Brown et al., 2020)",
        "(Achiam et al., 2023)",
        "(CitePilot, 2026)",
      ];

      modernCitations.forEach((cite) => {
        const text = `Modern attention standards were verified in ${cite}.`;
        const suggestions = runLiveHeuristicAudit(text);
        const outdatedSug = suggestions.find(
          (s) => s.category === "outdated-reference"
        );
        expect(
          outdatedSug,
          `Expected modern citation ${cite} NOT to be flagged as outdated`
        ).toBeUndefined();
      });
    });

    it("resists ReDoS attacks and processes massive repetitive adversarial text within tight time bounds", () => {
      // 1. Standard 5,000 character academic manuscript
      const standardText = `${"It is widely agreed that 45.5% of researchers obviously prove beyond doubt that (Smith, 2011). ".repeat(50)}`;
      const startStd = performance.now();
      const stdSuggestions = runLiveHeuristicAudit(standardText);
      const elapsedStd = performance.now() - startStd;

      expect(stdSuggestions.length).toBeGreaterThan(0);
      expect(elapsedStd).toBeLessThan(50); // Under 50ms for standard 5k char draft

      // 2. Massive 30,000 character stress payload
      const massivePrefix = "It is widely agreed that ".repeat(200);
      const massiveStats = "with 45.5% accuracy increase and 20-30% reduction ".repeat(
        200
      );
      const massiveUnhedged = "which obviously proves beyond doubt that ".repeat(200);
      const massiveOutdated = "(Smith, 2011) and (Jones, 2005) ".repeat(200);
      const massiveText = `${massivePrefix} ${massiveStats} ${massiveUnhedged} ${massiveOutdated}`;

      const startTime = performance.now();
      const suggestions = runLiveHeuristicAudit(massiveText);
      const elapsed = performance.now() - startTime;

      expect(suggestions.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(500); // Under 500ms for 30k char payload
    });
  });

  // =========================================================================
  // 2. OVERLAPPING SPANS PREVENTION & SEGMENT PARTITION INVARIANTS
  // =========================================================================
  describe("2. Overlapping Spans Prevention & Text Partition Invariants", () => {
    it("guarantees strictly non-overlapping spans under dense contiguous heuristic matches", () => {
      const denseText =
        "It is widely agreed that 99.9% of researchers obviously prove beyond doubt that (Smith, 1999) is an undisputed fact.";
      const suggestions = runLiveHeuristicAudit(denseText);

      expect(suggestions.length).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i];
        const next = suggestions[i + 1];

        // Strict non-overlap: current.endIndex <= next.startIndex
        expect(
          current.endIndex,
          `Span ${current.id} overlaps with span ${next.id}`
        ).toBeLessThanOrEqual(next.startIndex);

        // Valid span bounds
        expect(current.startIndex).toBeLessThan(current.endIndex);
        expect(
          denseText.substring(current.startIndex, current.endIndex)
        ).toBe(current.originalText);
      }
    });

    it("verifies splitTextIntoSegments preserves 100% of characters with zero text loss or distortion", () => {
      const draft = ACADEMIC_DRAFTS["lit-review"];
      const segments = splitTextIntoSegments(
        draft.initialText,
        draft.defaultSuggestions,
        "lit-1",
        "lit-2"
      );

      const reconstructed = segments.map((s) => s.content).join("");
      expect(reconstructed).toBe(draft.initialText);
      expect(reconstructed.length).toBe(draft.initialText.length);

      // Verify highlighted segments preserve metadata
      const highlights = segments.filter((s) => s.type === "highlight");
      expect(highlights.length).toBe(draft.defaultSuggestions.length);
      highlights.forEach((hl) => {
        if (hl.type === "highlight") {
          expect(hl.content).toBe(hl.suggestion.originalText);
        }
      });
    });
  });

  // =========================================================================
  // 3. SPAN MUTATION & OFFSET SHIFTING INVARIANTS
  // =========================================================================
  describe("3. Span Mutation & Offset Shifting Invariants", () => {
    it("handles out-of-order suggestion application (reverse order: 4 -> 3 -> 2 -> 1) without drift", () => {
      const draft = ACADEMIC_DRAFTS["lit-review"];
      let text = draft.initialText;
      let suggestions = [...draft.defaultSuggestions];

      // Apply in reverse order
      const reverseSuggestions = [...draft.defaultSuggestions].reverse();
      for (const sug of reverseSuggestions) {
        const target = suggestions.find((s) => s.id === sug.id)!;
        const res = applySuggestionReplacement(text, target, suggestions);
        text = res.newText;
        suggestions = res.updatedSuggestions;
      }

      // Check all suggestions are accepted and present in final text
      expect(suggestions.every((s) => s.status === "accepted")).toBe(true);
      for (const sug of draft.defaultSuggestions) {
        expect(text).toContain(sug.replacementText);
      }
    });

    it("gracefully falls back when target originalText is missing or externally modified", () => {
      const modifiedText = "Arbitrary unrelated text without any matching anchors.";
      const targetSuggestion: DemoSuggestion = {
        id: "ghost-1",
        category: "missing-citation",
        title: "Ghost Citation",
        rationale: "Rationale",
        originalText: "Nonexistent original phrase",
        replacementText: "Replacement phrase",
        status: "pending",
        startIndex: 10,
        endIndex: 35,
        impactScore: 10,
      };

      const res = applySuggestionReplacement(modifiedText, targetSuggestion, [
        targetSuggestion,
      ]);

      // Text must not be corrupted
      expect(res.newText).toBe(modifiedText);
      expect(res.updatedSuggestions[0].status).toBe("accepted");
    });
  });

  // =========================================================================
  // 4. SCORING FORMULA MONOTONICITY, SUB-METRICS & 100% BOUNDS
  // =========================================================================
  describe("4. Rigor Scoring Math Bounds, Monotonicity & Sub-Metrics", () => {
    it("verifies mathematical bounds [0, 100] across diverse base scores and resolutions", () => {
      const testScenarios = [
        { base: -50, total: 4, accepted: 0, dismissed: 0, wc: 100 },
        { base: 0, total: 4, accepted: 2, dismissed: 1, wc: 100 },
        { base: 64, total: 4, accepted: 0, dismissed: 0, wc: 100 },
        { base: 64, total: 4, accepted: 4, dismissed: 0, wc: 100 },
        { base: 80, total: 10, accepted: 5, dismissed: 5, wc: 200 },
        { base: 95, total: 2, accepted: 2, dismissed: 0, wc: 150 },
        { base: 100, total: 4, accepted: 4, dismissed: 0, wc: 100 },
        { base: 150, total: 4, accepted: 4, dismissed: 0, wc: 100 },
        { base: 64, total: 0, accepted: 0, dismissed: 0, wc: 5 },
        { base: 64, total: 0, accepted: 0, dismissed: 0, wc: 50 },
      ];

      testScenarios.forEach(({ base, total, accepted, dismissed, wc }) => {
        const acceptedIds = Array.from({ length: accepted }, (_, i) => `a-${i}`);
        const dismissedIds = Array.from({ length: dismissed }, (_, i) => `d-${i}`);
        const metrics = calculateRigorScore(total, acceptedIds, dismissedIds, base, wc);

        expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
        expect(metrics.overallScore).toBeLessThanOrEqual(100);
        expect(metrics.sourceCoverage).toBeGreaterThanOrEqual(0);
        expect(metrics.sourceCoverage).toBeLessThanOrEqual(100);
        expect(metrics.claimIntegrity).toBeGreaterThanOrEqual(0);
        expect(metrics.claimIntegrity).toBeLessThanOrEqual(100);
        expect(metrics.scholarlyTone).toBeGreaterThanOrEqual(0);
        expect(metrics.scholarlyTone).toBeLessThanOrEqual(100);
      });
    });

    it("verifies strict score monotonicity: Accept >= Dismiss >= No Action", () => {
      const suggestions = ACADEMIC_DRAFTS["intro"].defaultSuggestions;
      const base = 64;

      const baseMetrics = calculateRigorScore(suggestions, [], [], base);
      const dismissedOne = calculateRigorScore(
        suggestions,
        [],
        ["bio-1"],
        base
      );
      const acceptedOne = calculateRigorScore(
        suggestions,
        ["bio-1"],
        [],
        base
      );

      expect(dismissedOne.overallScore).toBeGreaterThanOrEqual(
        baseMetrics.overallScore
      );
      expect(acceptedOne.overallScore).toBeGreaterThanOrEqual(
        dismissedOne.overallScore
      );
    });

    it("verifies 100% score ceiling and Optimal status when all opportunities are accepted", () => {
      const drafts: (keyof typeof ACADEMIC_DRAFTS)[] = [
        "lit-review",
        "intro",
        "discussion",
      ];

      drafts.forEach((draftKey) => {
        const draft = ACADEMIC_DRAFTS[draftKey];
        const allIds = draft.defaultSuggestions.map((s) => s.id);
        const metrics = calculateRigorScore(
          draft.defaultSuggestions,
          allIds,
          [],
          draft.baseScore
        );

        expect(metrics.overallScore).toBe(100);
        expect(metrics.unresolvedCount).toBe(0);
        expect(metrics.statusLabel).toBe("Ready for Journal Submission");
        expect(metrics.isOptimal).toBe(true);
      });
    });
  });

  // =========================================================================
  // 5. LIVE CUSTOM TYPING, DEBOUNCING & CONCURRENCY
  // =========================================================================
  describe("5. Live Custom Typing State Machine & Concurrency", () => {
    it("handles rapid sequential typing updates in custom draft without state corruption", () => {
      const { result } = renderHook(() => useDemoEditor("custom"));

      const phrases = [
        "Recent developments in AI.",
        "Recent developments in AI obviously prove beyond doubt that neural search is optimal.",
        "Recent developments in AI obviously prove beyond doubt that neural search is 45% better (Smith, 2010).",
      ];

      phrases.forEach((phrase) => {
        act(() => {
          result.current.updateText(phrase);
        });
      });

      expect(result.current.currentText).toBe(phrases[2]);
      expect(result.current.activeSuggestions.length).toBeGreaterThan(0);
    });

    it("preserves independent draft state across multiple switches and custom edits", () => {
      const { result } = renderHook(() => useDemoEditor("lit-review"));

      // 1. Accept first suggestion in lit-review
      act(() => {
        result.current.acceptSuggestion("lit-1");
      });
      const litReviewScore = result.current.scoreMetrics.overallScore;

      // 2. Switch to custom
      act(() => {
        result.current.selectDraft("custom");
      });
      expect(result.current.activeDraftId).toBe("custom");

      // 3. Type custom text in custom draft
      act(() => {
        result.current.updateText(
          "Custom text with 35% improvement that obviously proves the hypothesis."
        );
      });
      expect(result.current.currentText).toContain("Custom text with 35%");

      // 4. Switch to discussion
      act(() => {
        result.current.selectDraft("discussion");
      });
      expect(result.current.activeDraftId).toBe("discussion");

      // 5. Switch back to lit-review -> prior state must be intact
      act(() => {
        result.current.selectDraft("lit-review");
      });
      expect(result.current.activeDraftId).toBe("lit-review");
      expect(result.current.scoreMetrics.overallScore).toBe(litReviewScore);
      expect(result.current.pendingSuggestions).toHaveLength(3);

      // 6. Switch back to custom -> custom text must be intact
      act(() => {
        result.current.selectDraft("custom");
      });
      expect(result.current.currentText).toContain("Custom text with 35%");
    });
  });

  // =========================================================================
  // 6. MALFORMED / ADVERSARIAL INPUT RESILIENCE
  // =========================================================================
  describe("6. Malformed & Adversarial Inputs Resilience", () => {
    it("safely handles null, undefined, emoji, unicode surrogates, and control characters", () => {
      const weirdInputs = [
        "",
        "   ",
        "\n\t\r",
        "🚀🔬✨💡🧬📊",
        "سلام دنیا (Al-Khwarizmi, 820)",
        "这是一个中文测试，没有任何引用。",
        "Mathematical symbols: ∑(x_i) = ∫ f(x)dx with 99.99% accuracy.",
        "Special regex metacharacters: [a-z]*+?^${}()|\\",
        "<script>alert('xss')</script> with 50% increase",
        '{"json": "payload", "percent": "25%"}',
      ];

      weirdInputs.forEach((input) => {
        expect(() => {
          const suggestions = runLiveHeuristicAudit(input);
          const segments = splitTextIntoSegments(input, suggestions, null, null);
          const reconstituted = segments.map((s) => s.content).join("");
          expect(reconstituted).toBe(input);
        }).not.toThrow();
      });
    });
  });
});
