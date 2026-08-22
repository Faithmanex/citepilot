import { describe, it, expect } from "vitest";
import { applySuggestionReplacement, splitTextIntoSegments } from "../spanMutation";
import { ACADEMIC_DRAFTS } from "../sampleDrafts";
import type { DemoSuggestion } from "../types";

describe("Span Mutation & Offset Management Engine (spanMutation)", () => {
  it("replaces target text inline and updates target status to accepted", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const target = draft.defaultSuggestions[0]; // lit-1
    const { newText, updatedSuggestions } = applySuggestionReplacement(
      draft.initialText,
      target,
      draft.defaultSuggestions
    );

    expect(newText).toContain(target.replacementText);
    expect(newText).not.toContain(target.originalText);
    
    const updatedTarget = updatedSuggestions.find((s) => s.id === target.id);
    expect(updatedTarget?.status).toBe("accepted");
    expect(updatedTarget?.endIndex).toBe(
      (updatedTarget?.startIndex ?? 0) + target.replacementText.length
    );
  });

  it("shifts character offsets of all subsequent suggestions without index drift", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const firstSug = draft.defaultSuggestions[0]; // lit-1
    const secondSug = draft.defaultSuggestions[1]; // lit-2

    const originalDelta = firstSug.replacementText.length - firstSug.originalText.length;
    const { updatedSuggestions } = applySuggestionReplacement(
      draft.initialText,
      firstSug,
      draft.defaultSuggestions
    );

    const updatedSecond = updatedSuggestions.find((s) => s.id === secondSug.id);
    expect(updatedSecond?.startIndex).toBe(secondSug.startIndex + originalDelta);
    expect(updatedSecond?.endIndex).toBe(secondSug.endIndex + originalDelta);
  });

  it("successfully applies all 4 suggestions sequentially on Literature Review without text corruption", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    let currentText = draft.initialText;
    let currentSuggestions = [...draft.defaultSuggestions];

    for (const sug of draft.defaultSuggestions) {
      const targetInCurrent = currentSuggestions.find((s) => s.id === sug.id)!;
      const res = applySuggestionReplacement(currentText, targetInCurrent, currentSuggestions);
      currentText = res.newText;
      currentSuggestions = res.updatedSuggestions;
    }

    // All suggestions should be accepted
    expect(currentSuggestions.every((s) => s.status === "accepted")).toBe(true);

    // Replacement texts should all be present in final text
    for (const sug of draft.defaultSuggestions) {
      expect(currentText).toContain(sug.replacementText);
    }
  });

  it("splitTextIntoSegments splits text into alternating plain text and highlight segments", () => {
    const draft = ACADEMIC_DRAFTS["lit-review"];
    const segments = splitTextIntoSegments(
      draft.initialText,
      draft.defaultSuggestions,
      "lit-1",
      null
    );

    expect(segments.length).toBeGreaterThan(1);

    // Reconstituted text must match original initialText exactly (zero lost characters)
    const reconstituted = segments.map((seg) => seg.content).join("");
    expect(reconstituted).toBe(draft.initialText);

    // Check selected state on lit-1
    const highlightSegments = segments.filter((s) => s.type === "highlight");
    expect(highlightSegments.length).toBe(4);
    
    const lit1Segment = highlightSegments.find(
      (s) => s.type === "highlight" && s.suggestion.id === "lit-1"
    );
    expect(lit1Segment?.type === "highlight" && lit1Segment.isSelected).toBe(true);
  });

  it("splitTextIntoSegments returns single plain text segment when no suggestions are pending", () => {
    const acceptedSuggestions: DemoSuggestion[] = ACADEMIC_DRAFTS["lit-review"].defaultSuggestions.map(
      (s) => ({ ...s, status: "accepted" as const })
    );

    const segments = splitTextIntoSegments("Clean manuscript text.", acceptedSuggestions, null, null);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("text");
    expect(segments[0].content).toBe("Clean manuscript text.");
  });
});
