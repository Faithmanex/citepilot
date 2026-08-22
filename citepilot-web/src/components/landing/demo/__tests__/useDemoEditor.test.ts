// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoEditor } from "../useDemoEditor";

describe("useDemoEditor Hook State Machine", () => {
  it("initializes with literature review draft by default", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));

    expect(result.current.activeDraftId).toBe("lit-review");
    expect(result.current.currentDraft.name).toBe("Literature Review");
    expect(result.current.pendingSuggestions).toHaveLength(4);
    expect(result.current.scoreMetrics.overallScore).toBe(64);
    expect(result.current.selectedSuggestion).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it("switches drafts seamlessly and updates text and suggestions", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));

    act(() => {
      result.current.selectDraft("intro");
    });

    expect(result.current.activeDraftId).toBe("intro");
    expect(result.current.currentDraft.name).toBe("Introduction");
    expect(result.current.pendingSuggestions[0].id).toBe("bio-1");
  });

  it("selects and hovers suggestions correctly", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));

    act(() => {
      result.current.selectSuggestion("lit-1");
      result.current.hoverSuggestion("lit-2");
    });

    expect(result.current.selectedSuggestionId).toBe("lit-1");
    expect(result.current.selectedSuggestion?.id).toBe("lit-1");
    expect(result.current.hoveredSuggestionId).toBe("lit-2");
  });

  it("acceptSuggestion updates text inline, reduces pending count, and increments rigor score", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));
    const initialText = result.current.currentText;
    const initialScore = result.current.scoreMetrics.overallScore;

    act(() => {
      result.current.acceptSuggestion("lit-1");
    });

    expect(result.current.currentText).not.toBe(initialText);
    expect(result.current.currentText).toContain("Shazeer, 2019");
    expect(result.current.pendingSuggestions).toHaveLength(3);
    expect(result.current.scoreMetrics.overallScore).toBeGreaterThan(initialScore);
    expect(result.current.isDirty).toBe(true);
  });

  it("dismissSuggestion preserves text content, clears pending highlight, and marks as dirty", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));
    const initialText = result.current.currentText;

    act(() => {
      result.current.dismissSuggestion("lit-1");
    });

    expect(result.current.currentText).toBe(initialText);
    expect(result.current.pendingSuggestions).toHaveLength(3);
    expect(result.current.scoreMetrics.dismissedCount).toBe(1);
    expect(result.current.isDirty).toBe(true);
  });

  it("acceptAll resolves all pending suggestions and reaches 100% score", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.pendingSuggestions).toHaveLength(0);
    expect(result.current.scoreMetrics.overallScore).toBe(100);
    expect(result.current.scoreMetrics.statusLabel).toBe("Ready for Journal Submission");
  });

  it("resetDraft restores pristine initial state after modifications", () => {
    const { result } = renderHook(() => useDemoEditor("lit-review"));

    act(() => {
      result.current.acceptSuggestion("lit-1");
      result.current.dismissSuggestion("lit-2");
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetDraft();
    });

    expect(result.current.pendingSuggestions).toHaveLength(4);
    expect(result.current.scoreMetrics.overallScore).toBe(64);
    expect(result.current.scoreMetrics.acceptedCount).toBe(0);
    expect(result.current.scoreMetrics.dismissedCount).toBe(0);
    expect(result.current.isDirty).toBe(false);
  });

  it("triggers live heuristic audit when typing custom text", () => {
    const { result } = renderHook(() => useDemoEditor("custom"));

    act(() => {
      result.current.updateText(
        "Our team obviously proves beyond doubt that neural search boosts retrieval by 45.5%."
      );
    });

    expect(result.current.activeSuggestions.length).toBeGreaterThan(0);
  });
});
