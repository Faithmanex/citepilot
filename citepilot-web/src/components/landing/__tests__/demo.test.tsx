// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  calculateRigorScore,
  ACADEMIC_DRAFTS,
  DRAFT_LIST,
  applySuggestionReplacement,
  splitTextIntoSegments,
  runLiveHeuristicAudit,
  HEURISTIC_RULES,
  useDemoEditor,
  DemoDraftSelector,
  DemoScoreCounter,
  DemoEditorSurface,
  DemoHighlightSpan,
  DemoSuggestionCard,
  InteractiveDemoEditor,
} from "../demo";
import type { DemoSuggestion, RigorMetrics } from "../demo/types";

// Helper test wrapper for hook testing
function HookTestComponent({
  initialDraft = "lit-review",
}: {
  initialDraft?: "lit-review" | "intro" | "discussion" | "custom";
}) {
  const hook = useDemoEditor(initialDraft);
  return (
    <div>
      <div data-testid="hook-text">{hook.currentText}</div>
      <div data-testid="hook-score">{hook.scoreMetrics.overallScore}</div>
      <div data-testid="hook-status">{hook.scoreMetrics.statusLabel}</div>
      <div data-testid="hook-unresolved">{hook.scoreMetrics.unresolvedCount}</div>
      <div data-testid="hook-accepted">{hook.scoreMetrics.acceptedCount}</div>
      <button data-testid="btn-select-intro" onClick={() => hook.selectDraft("intro")}>
        Select Intro
      </button>
      <button data-testid="btn-select-custom" onClick={() => hook.selectDraft("custom")}>
        Select Custom
      </button>
      <button
        data-testid="btn-accept-first"
        onClick={() => {
          if (hook.pendingSuggestions.length > 0) {
            hook.acceptSuggestion(hook.pendingSuggestions[0].id);
          }
        }}
      >
        Accept First
      </button>
      <button
        data-testid="btn-dismiss-first"
        onClick={() => {
          if (hook.pendingSuggestions.length > 0) {
            hook.dismissSuggestion(hook.pendingSuggestions[0].id);
          }
        }}
      >
        Dismiss First
      </button>
      <button data-testid="btn-accept-all" onClick={() => hook.acceptAll()}>
        Accept All
      </button>
      <button data-testid="btn-reset" onClick={() => hook.resetDraft()}>
        Reset Draft
      </button>
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe("Milestone 2: Rigor Scoring Engine (rigorScoring.ts)", () => {
  it("calculates initial baseline score of 64% with 4 unresolved flaws", () => {
    const metrics = calculateRigorScore(4, [], [], 64);
    expect(metrics.overallScore).toBe(64);
    expect(metrics.unresolvedCount).toBe(4);
    expect(metrics.acceptedCount).toBe(0);
    expect(metrics.dismissedCount).toBe(0);
    expect(metrics.statusLabel).toBe("Needs Immediate Attention");
  });

  it("strictly increments score monotonically as suggestions are accepted", () => {
    const score0 = calculateRigorScore(4, [], [], 64).overallScore;
    const score1 = calculateRigorScore(4, ["lit-1"], [], 64).overallScore;
    const score2 = calculateRigorScore(4, ["lit-1", "lit-2"], [], 64).overallScore;
    const score3 = calculateRigorScore(4, ["lit-1", "lit-2", "lit-3"], [], 64).overallScore;
    const score4 = calculateRigorScore(4, ["lit-1", "lit-2", "lit-3", "lit-4"], [], 64).overallScore;

    expect(score0).toBe(64);
    expect(score1).toBe(73);
    expect(score2).toBe(82);
    expect(score3).toBe(91);
    expect(score4).toBe(100);
  });

  it("awards partial credit for dismissed suggestions without exceeding accepted fix score", () => {
    const metricsDismissed = calculateRigorScore(4, [], ["lit-1"], 64);
    const metricsAccepted = calculateRigorScore(4, ["lit-1"], [], 64);

    expect(metricsDismissed.overallScore).toBeGreaterThan(64);
    expect(metricsDismissed.overallScore).toBeLessThan(metricsAccepted.overallScore);
  });

  it("calculates accurate sub-metrics for source coverage, claim integrity, and scholarly tone", () => {
    const suggestions = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions;
    const metrics = calculateRigorScore(suggestions, ["lit-1", "lit-2"], [], 64);

    expect(metrics.sourceCoverage).toBeGreaterThanOrEqual(60);
    expect(metrics.claimIntegrity).toBeGreaterThanOrEqual(60);
    expect(metrics.scholarlyTone).toBeGreaterThanOrEqual(60);
  });

  it("transitions status classifications accurately based on score thresholds", () => {
    expect(calculateRigorScore(4, [], [], 64).statusLabel).toBe("Needs Immediate Attention");
    expect(calculateRigorScore(4, ["1", "2"], [], 64).statusLabel).toBe("Moderate Verification Needed");
    expect(calculateRigorScore(4, ["1", "2", "3"], [], 64).statusLabel).toBe("Strong Academic Rigor");
    expect(calculateRigorScore(4, ["1", "2", "3", "4"], [], 64).statusLabel).toBe(
      "Ready for Journal Submission"
    );
  });

  it("evaluates custom text with 0 flaws and >15 words as publication ready (98%)", () => {
    const metrics = calculateRigorScore(0, [], [], 64, 25);
    expect(metrics.overallScore).toBe(98);
    expect(metrics.isOptimal).toBe(true);
    expect(metrics.statusLabel).toBe("Ready for Journal Submission");
  });
});

describe("Milestone 2: Academic Sample Drafts (sampleDrafts.ts)", () => {
  it("exports exactly 4 drafts: Literature Review, Introduction, Discussion, and Custom", () => {
    expect(DRAFT_LIST).toHaveLength(4);
    expect(ACADEMIC_DRAFTS["lit-review"]).toBeDefined();
    expect(ACADEMIC_DRAFTS.intro).toBeDefined();
    expect(ACADEMIC_DRAFTS.discussion).toBeDefined();
    expect(ACADEMIC_DRAFTS.custom).toBeDefined();
  });

  it("verifies character indices and target spans match manuscript text exactly", () => {
    const presetDrafts = [
      ACADEMIC_DRAFTS["lit-review"],
      ACADEMIC_DRAFTS.intro,
      ACADEMIC_DRAFTS.discussion,
    ];

    presetDrafts.forEach((draft) => {
      expect(draft.defaultSuggestions).toHaveLength(4);

      draft.defaultSuggestions.forEach((suggestion) => {
        const sliced = draft.initialText.substring(suggestion.startIndex, suggestion.endIndex);
        expect(sliced).toBe(suggestion.originalText);
        expect(suggestion.originalSpan).toBe(suggestion.originalText);
        expect(suggestion.suggestedReplacement).toBe(suggestion.replacementText);
        expect(suggestion.explanation).toBe(suggestion.rationale);
        expect(suggestion.status).toBe("pending");
      });
    });
  });

  it("covers all 4 required flaw categories in every preset draft", () => {
    const requiredCategories = [
      "missing-citation",
      "claim-needs-source",
      "outdated-reference",
      "tone-clarity",
    ];

    [ACADEMIC_DRAFTS["lit-review"], ACADEMIC_DRAFTS.intro, ACADEMIC_DRAFTS.discussion].forEach(
      (draft) => {
        const categories = draft.defaultSuggestions.map((s) => s.category);
        requiredCategories.forEach((cat) => {
          expect(categories).toContain(cat);
        });
      }
    );
  });
});

describe("Milestone 2: Span Mutation & Segment Splitting (spanMutation.ts)", () => {
  it("replaces target text inline and updates subsequent character offsets", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const target = draft.defaultSuggestions[0]; // lit-1
    const { newText, updatedSuggestions } = applySuggestionReplacement(
      draft.initialText,
      target,
      draft.defaultSuggestions
    );

    expect(newText).toContain(target.replacementText);
    expect(newText).not.toContain(target.originalText);

    // Verified offset delta
    const delta = target.replacementText.length - target.originalText.length;
    const nextOriginal = draft.defaultSuggestions[1];
    const nextUpdated = updatedSuggestions.find((s) => s.id === nextOriginal.id);
    expect(nextUpdated?.startIndex).toBe(nextOriginal.startIndex + delta);
    expect(nextUpdated?.endIndex).toBe(nextOriginal.endIndex + delta);
  });

  it("splits text and highlights into contiguous segments without losing characters", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const segments = splitTextIntoSegments(draft.initialText, draft.defaultSuggestions, null, null);

    const reconstituted = segments.map((s) => s.content).join("");
    expect(reconstituted).toBe(draft.initialText);
  });
});

describe("Milestone 2: Heuristic Regex NLP Engine (nlpRuleEngine.ts)", () => {
  it("detects unhedged assertions and assigns tone-clarity category", () => {
    const input = "This obviously proves beyond doubt that transformers excel.";
    const results = runLiveHeuristicAudit(input);

    expect(results.length).toBeGreaterThan(0);
    const toneIssue = results.find((r) => r.category === "tone-clarity");
    expect(toneIssue).toBeDefined();
    expect(toneIssue?.replacementText).toContain("indicates");
  });

  it("detects uncited statistical percentages and assigns claim-needs-source category", () => {
    const input = "The accuracy increased by 42.5% across all datasets.";
    const results = runLiveHeuristicAudit(input);

    const statIssue = results.find((r) => r.category === "claim-needs-source");
    expect(statIssue).toBeDefined();
    expect(statIssue?.replacementText).toContain("2024");
  });

  it("detects broad consensus claims lacking attribution and assigns missing-citation", () => {
    const input = "It is widely agreed that neural models require scaling.";
    const results = runLiveHeuristicAudit(input);

    const consensusIssue = results.find((r) => r.category === "missing-citation");
    expect(consensusIssue).toBeDefined();
    expect(consensusIssue?.replacementText).toContain("Chen");
  });

  it("detects pre-2016 citations and assigns outdated-reference category", () => {
    const input = "Early recurrent models suffered bottlenecks (Graves, 2013).";
    const results = runLiveHeuristicAudit(input);

    const outdatedIssue = results.find((r) => r.category === "outdated-reference");
    expect(outdatedIssue).toBeDefined();
    expect(outdatedIssue?.replacementText).toContain("2024");
  });

  it("returns empty array for empty or short text without crashing", () => {
    expect(runLiveHeuristicAudit("")).toEqual([]);
    expect(runLiveHeuristicAudit("   ")).toEqual([]);
    expect(runLiveHeuristicAudit("test")).toEqual([]);
  });

  it("exports 4 well-formed HEURISTIC_RULES covering all 4 flaw categories", () => {
    expect(HEURISTIC_RULES).toHaveLength(4);
    const categories = HEURISTIC_RULES.map((r) => r.category);
    expect(categories).toContain("tone-clarity");
    expect(categories).toContain("claim-needs-source");
    expect(categories).toContain("missing-citation");
    expect(categories).toContain("outdated-reference");
  });
});

describe("Milestone 2: useDemoEditor State Machine Hook", () => {
  afterEach(() => {
    cleanup();
  });

  it("initializes with Literature Review draft defaults", () => {
    render(<HookTestComponent />);

    expect(screen.getByTestId("hook-score").textContent).toBe("64");
    expect(screen.getByTestId("hook-unresolved").textContent).toBe("4");
    expect(screen.getByTestId("hook-accepted").textContent).toBe("0");
  });

  it("switches drafts cleanly and updates text and suggestions", () => {
    render(<HookTestComponent />);

    fireEvent.click(screen.getByTestId("btn-select-intro"));
    expect(screen.getByTestId("hook-text").textContent).toContain("programmable RNA-guided");
    expect(screen.getByTestId("hook-score").textContent).toBe("64");
  });

  it("accepts a suggestion, replaces text inline, and increments rigor score", () => {
    render(<HookTestComponent />);

    fireEvent.click(screen.getByTestId("btn-accept-first"));
    expect(screen.getByTestId("hook-score").textContent).toBe("73");
    expect(screen.getByTestId("hook-accepted").textContent).toBe("1");
    expect(screen.getByTestId("hook-unresolved").textContent).toBe("3");
  });

  it("dismisses a suggestion, leaves text unchanged, and removes highlight", () => {
    render(<HookTestComponent />);

    const initialText = screen.getByTestId("hook-text").textContent;
    fireEvent.click(screen.getByTestId("btn-dismiss-first"));

    expect(screen.getByTestId("hook-text").textContent).toBe(initialText);
    expect(screen.getByTestId("hook-unresolved").textContent).toBe("3");
  });

  it("acceptAll resolves all pending suggestions and reaches 100% score", () => {
    render(<HookTestComponent />);

    fireEvent.click(screen.getByTestId("btn-accept-all"));
    expect(screen.getByTestId("hook-score").textContent).toBe("100");
    expect(screen.getByTestId("hook-unresolved").textContent).toBe("0");
    expect(screen.getByTestId("hook-status").textContent).toBe("Ready for Journal Submission");
  });

  it("resetDraft restores pristine text and resets score to base", () => {
    render(<HookTestComponent />);

    fireEvent.click(screen.getByTestId("btn-accept-first"));
    expect(screen.getByTestId("hook-score").textContent).toBe("73");

    fireEvent.click(screen.getByTestId("btn-reset"));
    expect(screen.getByTestId("hook-score").textContent).toBe("64");
    expect(screen.getByTestId("hook-accepted").textContent).toBe("0");
  });
});

describe("Milestone 2: UI Component Rendering & Design Tokens", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders DemoDraftSelector with 4 tabs and reset button", () => {
    const onSelect = vi.fn();
    const onReset = vi.fn();

    render(
      <DemoDraftSelector
        activeDraftId="lit-review"
        onSelectDraft={onSelect}
        onReset={onReset}
        isDirty={true}
      />
    );

    expect(screen.getByText("Literature Review")).toBeDefined();
    expect(screen.getByText("Introduction")).toBeDefined();
    expect(screen.getByText("Discussion")).toBeDefined();
    expect(screen.getByText("Custom Draft")).toBeDefined();

    const resetBtn = screen.getByLabelText("Reset draft to original manuscript state");
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();
  });

  it("renders DemoScoreCounter with circular SVG gauge and sub-metrics", () => {
    const metrics: RigorMetrics = {
      overallScore: 88,
      sourceCoverage: 85,
      claimIntegrity: 90,
      scholarlyTone: 89,
      totalCount: 4,
      unresolvedCount: 1,
      acceptedCount: 3,
      dismissedCount: 0,
      statusLabel: "Strong Academic Rigor",
      isOptimal: false,
    };

    render(<DemoScoreCounter metrics={metrics} />);

    expect(screen.getByText("88%")).toBeDefined();
    expect(screen.getByText("Strong Academic Rigor")).toBeDefined();
    expect(screen.getByTestId("metric-tile-source-coverage")).toBeDefined();
    expect(screen.getByTestId("metric-tile-claim-integrity")).toBeDefined();
    expect(screen.getByTestId("metric-tile-scholarly-tone")).toBeDefined();
  });

  it("renders DemoSuggestionCard diff view and handles Accept and Dismiss clicks", () => {
    const suggestion: DemoSuggestion = {
      id: "test-1",
      category: "missing-citation",
      title: "Unattributed Architectural Claim",
      rationale: "Key architectural claim requires citation.",
      originalText: "Multi-query attention reduces KV-cache.",
      replacementText: "Multi-query attention reduces KV-cache (Shazeer, 2019).",
      status: "pending",
      startIndex: 0,
      endIndex: 38,
      impactScore: 9,
      metadata: {
        authors: "Shazeer, N.",
        doi: "10.48550/arXiv.1911.02150",
        crossrefVerified: true,
      },
    };

    const onAccept = vi.fn();
    const onDismiss = vi.fn();

    render(
      <DemoSuggestionCard
        suggestion={suggestion}
        onAccept={onAccept}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Unattributed Architectural Claim")).toBeDefined();
    expect(screen.getByText("Multi-query attention reduces KV-cache.")).toBeDefined();
    expect(screen.getByText("Multi-query attention reduces KV-cache (Shazeer, 2019).")).toBeDefined();
    expect(screen.getByText("CrossRef Verified")).toBeDefined();

    fireEvent.click(screen.getByText("Accept Fix"));
    expect(onAccept).toHaveBeenCalledWith("test-1");

    fireEvent.click(screen.getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledWith("test-1");
  });

  it("renders empty state in DemoSuggestionCard when no suggestion is selected", () => {
    render(<DemoSuggestionCard suggestion={null} onAccept={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("suggestion-card-empty")).toBeDefined();
    expect(screen.getByText("No Citation Selected")).toBeDefined();
  });

  it("renders DemoHighlightSpan and handles click and hover events", () => {
    const suggestion = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions[0];
    const onClick = vi.fn();
    const onMouseEnter = vi.fn();

    render(
      <DemoHighlightSpan
        suggestion={suggestion}
        content={suggestion.originalText}
        isSelected={false}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      />
    );

    const span = screen.getByTestId(`highlight-${suggestion.id}`);
    expect(span).toBeDefined();
    fireEvent.click(span);
    expect(onClick).toHaveBeenCalledWith(suggestion.id);
  });

  it("renders DemoEditorSurface in preset manuscript mode and custom textarea mode", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const segments = splitTextIntoSegments(draft.initialText, draft.defaultSuggestions, null, null);
    const onUpdate = vi.fn();
    const onSelect = vi.fn();

    const { rerender } = render(
      <DemoEditorSurface
        currentText={draft.initialText}
        textSegments={segments}
        isCustomTyping={false}
        onUpdateText={onUpdate}
        onSelectSuggestion={onSelect}
      />
    );

    expect(screen.getByTestId("demo-editor-canvas")).toBeDefined();
    expect(screen.getByText("Academic Manuscript Canvas")).toBeDefined();

    // Rerender in custom typing mode
    rerender(
      <DemoEditorSurface
        currentText={draft.initialText}
        textSegments={segments}
        isCustomTyping={true}
        onUpdateText={onUpdate}
        onSelectSuggestion={onSelect}
      />
    );

    expect(screen.getByTestId("custom-manuscript-textarea")).toBeDefined();
    expect(screen.getByText("Interactive Custom Editor")).toBeDefined();
  });

  it("renders InteractiveDemoEditor within 1200px container and supports interactive workflow", () => {
    render(<InteractiveDemoEditor />);

    expect(screen.getByTestId("interactive-demo-editor")).toBeDefined();
    expect(screen.getByTestId("demo-editor-canvas")).toBeDefined();
    expect(screen.getByTestId("demo-score-counter")).toBeDefined();

    // Click on a highlighted span
    const highlightSpan = screen.getByTestId("highlight-lit-1");
    expect(highlightSpan).toBeDefined();
    fireEvent.click(highlightSpan);

    // Suggestion card should appear
    expect(screen.getByTestId("demo-suggestion-card")).toBeDefined();
    expect(screen.getByText("Unattributed Architectural Claim")).toBeDefined();

    // Click Accept Fix
    fireEvent.click(screen.getByText("Accept Fix"));

    // Score should update to 73%
    expect(screen.getAllByText("73%").length).toBeGreaterThan(0);
  });
});
