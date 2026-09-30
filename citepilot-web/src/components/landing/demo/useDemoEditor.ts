"use client";

import { useState, useMemo, useCallback } from "react";
import type { EditorSuggestion, FindingsSummary, TextSegment } from "@/lib/editor/types";
import { applySuggestionMutation, buildTextSegments } from "@/lib/editor/documentMutation";
import { summarizeFindings } from "@/lib/editor/suggestionAdapter";
import { DEMO_EXAMPLES } from "./examples";

interface DemoState {
  text: string;
  suggestions: EditorSuggestion[];
}

function initialState(): Record<string, DemoState> {
  return Object.fromEntries(
    DEMO_EXAMPLES.map((example) => [
      example.id,
      { text: example.text, suggestions: example.suggestions },
    ])
  );
}

/**
 * Drives the landing demo using the production editor engine
 * (`applySuggestionMutation`, `summarizeFindings`, `buildTextSegments`), so the
 * demo behaves exactly like the real workspace. There is no client-side
 * analysis step and no fabricated metadata.
 */
export function useDemoEditor(initialExampleId: string = DEMO_EXAMPLES[0].id) {
  const [activeExampleId, setActiveExampleId] = useState(
    DEMO_EXAMPLES.some((e) => e.id === initialExampleId) ? initialExampleId : DEMO_EXAMPLES[0].id
  );
  const [states, setStates] = useState<Record<string, DemoState>>(initialState);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);

  const state = states[activeExampleId];

  const findings: FindingsSummary = useMemo(
    () => summarizeFindings(state.suggestions),
    [state.suggestions]
  );

  const textSegments: TextSegment[] = useMemo(
    () =>
      buildTextSegments(
        state.text,
        state.suggestions,
        selectedSuggestionId,
        hoveredSuggestionId
      ),
    [state.text, state.suggestions, selectedSuggestionId, hoveredSuggestionId]
  );

  const activeSuggestions = useMemo(
    () => state.suggestions.filter((s) => s.status === "active"),
    [state.suggestions]
  );

  const selectedSuggestion = useMemo(
    () => state.suggestions.find((s) => s.id === selectedSuggestionId) ?? null,
    [state.suggestions, selectedSuggestionId]
  );

  const isDirty = useMemo(() => {
    const example = DEMO_EXAMPLES.find((e) => e.id === activeExampleId);
    if (!example) return false;
    return (
      state.text !== example.text ||
      state.suggestions.some((s) => s.status !== "active")
    );
  }, [activeExampleId, state]);

  const patchState = useCallback(
    (updater: (prev: DemoState) => DemoState) => {
      setStates((prev) => ({ ...prev, [activeExampleId]: updater(prev[activeExampleId]) }));
    },
    [activeExampleId]
  );

  const selectExample = useCallback((id: string) => {
    if (!DEMO_EXAMPLES.some((e) => e.id === id)) return;
    setActiveExampleId(id);
    setSelectedSuggestionId(null);
    setHoveredSuggestionId(null);
  }, []);

  const acceptSuggestion = useCallback(
    (id: string) => {
      patchState((prev) => {
        const target = prev.suggestions.find((s) => s.id === id);
        if (!target) return prev;
        const { newText, updatedSuggestions } = applySuggestionMutation(
          prev.text,
          target,
          prev.suggestions
        );
        return { text: newText, suggestions: updatedSuggestions };
      });

      const remaining = activeSuggestions.filter((s) => s.id !== id);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [patchState, activeSuggestions]
  );

  const dismissSuggestion = useCallback(
    (id: string) => {
      patchState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.map((s) =>
          s.id === id ? { ...s, status: "dismissed" as const } : s
        ),
      }));
      const remaining = activeSuggestions.filter((s) => s.id !== id);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [patchState, activeSuggestions]
  );

  const acceptAllStyle = useCallback(() => {
    patchState((prev) => {
      let text = prev.text;
      let list = prev.suggestions;
      for (const target of prev.suggestions.filter(
        (s) => s.status === "active" && s.category === "style"
      )) {
        const live = list.find((s) => s.id === target.id);
        if (live && live.status === "active") {
          const res = applySuggestionMutation(text, live, list);
          text = res.newText;
          list = res.updatedSuggestions;
        }
      }
      return { text, suggestions: list };
    });
    setSelectedSuggestionId(null);
  }, [patchState]);

  const reset = useCallback(() => {
    const example = DEMO_EXAMPLES.find((e) => e.id === activeExampleId);
    if (!example) return;
    setStates((prev) => ({
      ...prev,
      [activeExampleId]: { text: example.text, suggestions: example.suggestions },
    }));
    setSelectedSuggestionId(null);
    setHoveredSuggestionId(null);
  }, [activeExampleId]);

  return {
    activeExampleId,
    examples: DEMO_EXAMPLES,
    text: state.text,
    suggestions: state.suggestions,
    activeSuggestions,
    selectedSuggestion,
    findings,
    textSegments,
    isDirty,
    selectExample,
    acceptSuggestion,
    dismissSuggestion,
    acceptAllStyle,
    reset,
    selectSuggestion: setSelectedSuggestionId,
    hoverSuggestion: setHoveredSuggestionId,
  };
}
