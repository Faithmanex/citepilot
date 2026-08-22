"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { ACADEMIC_DRAFTS } from "./sampleDrafts";
import { calculateRigorScore } from "./rigorScoring";
import { applySuggestionReplacement, splitTextIntoSegments } from "./spanMutation";
import { runLiveHeuristicAudit } from "./nlpRuleEngine";
import type {
  AcademicDraft,
  DemoSuggestion,
  DraftStateRecord,
  RigorMetrics,
  TextSegment,
  UseDemoEditorReturn,
} from "./types";

export function useDemoEditor(
  initialDraftId: AcademicDraft["id"] = "lit-review"
): UseDemoEditorReturn {
  const [activeDraftId, setActiveDraftId] = useState<AcademicDraft["id"]>(initialDraftId);
  const [isPending, startTransition] = useTransition();

  // Multi-draft state store for seamless switching without state loss
  const [draftStates, setDraftStates] = useState<Record<AcademicDraft["id"], DraftStateRecord>>({
    "lit-review": {
      text: ACADEMIC_DRAFTS["lit-review"].initialText,
      acceptedIds: [],
      dismissedIds: [],
    },
    intro: {
      text: ACADEMIC_DRAFTS.intro.initialText,
      acceptedIds: [],
      dismissedIds: [],
    },
    discussion: {
      text: ACADEMIC_DRAFTS.discussion.initialText,
      acceptedIds: [],
      dismissedIds: [],
    },
    custom: {
      text: ACADEMIC_DRAFTS.custom.initialText,
      acceptedIds: [],
      dismissedIds: [],
      customSuggestions: undefined,
    },
  });

  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);

  const currentDraft = ACADEMIC_DRAFTS[activeDraftId] ?? ACADEMIC_DRAFTS["lit-review"];

  const currentDraftState = useMemo<DraftStateRecord>(() => {
    return (
      draftStates[activeDraftId] ?? {
        text: currentDraft.initialText,
        acceptedIds: [],
        dismissedIds: [],
      }
    );
  }, [draftStates, activeDraftId, currentDraft.initialText]);

  const isCustomTyping = activeDraftId === "custom";

  // Compute active suggestions with their latest status
  const activeSuggestions = useMemo<DemoSuggestion[]>(() => {
    const acceptedSet = new Set(currentDraftState.acceptedIds);
    const dismissedSet = new Set(currentDraftState.dismissedIds);

    if (isCustomTyping) {
      const suggestionsList =
        currentDraftState.customSuggestions !== undefined
          ? currentDraftState.customSuggestions
          : runLiveHeuristicAudit(currentDraftState.text);

      return suggestionsList.map((s) => {
        if (acceptedSet.has(s.id)) return { ...s, status: "accepted" as const };
        if (dismissedSet.has(s.id)) return { ...s, status: "dismissed" as const };
        return { ...s, status: "pending" as const };
      });
    }

    return currentDraft.defaultSuggestions.map((s) => {
      if (acceptedSet.has(s.id)) return { ...s, status: "accepted" as const };
      if (dismissedSet.has(s.id)) return { ...s, status: "dismissed" as const };
      return { ...s, status: "pending" as const };
    });
  }, [isCustomTyping, currentDraftState, currentDraft]);

  // Pending subset
  const pendingSuggestions = useMemo(
    () => activeSuggestions.filter((s) => s.status === "pending"),
    [activeSuggestions]
  );

  // Selected suggestion entity
  const selectedSuggestion = useMemo(() => {
    if (!selectedSuggestionId) return null;
    return activeSuggestions.find((s) => s.id === selectedSuggestionId) ?? null;
  }, [activeSuggestions, selectedSuggestionId]);

  // Word count helper
  const wordCount = useMemo(() => {
    return currentDraftState.text.trim().split(/\s+/).filter(Boolean).length;
  }, [currentDraftState.text]);

  // Dynamic Rigor Score
  const scoreMetrics = useMemo<RigorMetrics>(() => {
    return calculateRigorScore(
      activeSuggestions,
      currentDraftState.acceptedIds,
      currentDraftState.dismissedIds,
      currentDraft.baseScore,
      wordCount
    );
  }, [activeSuggestions, currentDraftState, currentDraft.baseScore, wordCount]);

  // Text segments for rendering
  const textSegments = useMemo<TextSegment[]>(() => {
    return splitTextIntoSegments(
      currentDraftState.text,
      activeSuggestions,
      selectedSuggestionId,
      hoveredSuggestionId
    );
  }, [currentDraftState.text, activeSuggestions, selectedSuggestionId, hoveredSuggestionId]);

  // Is dirty indicator
  const isDirty = useMemo(() => {
    return (
      currentDraftState.acceptedIds.length > 0 ||
      currentDraftState.dismissedIds.length > 0 ||
      currentDraftState.text !== currentDraft.initialText
    );
  }, [currentDraftState, currentDraft.initialText]);

  // Switch active draft
  const selectDraft = useCallback((draftId: AcademicDraft["id"]) => {
    setActiveDraftId(draftId);
    setSelectedSuggestionId(null);
    setHoveredSuggestionId(null);
  }, []);

  // Update text with debounced live heuristic analysis for custom draft
  const updateText = useCallback(
    (newText: string) => {
      setDraftStates((prev) => ({
        ...prev,
        [activeDraftId]: {
          ...prev[activeDraftId],
          text: newText,
        },
      }));

      if (activeDraftId === "custom") {
        startTransition(() => {
          const freshSuggestions = runLiveHeuristicAudit(newText);
          setDraftStates((prev) => ({
            ...prev,
            custom: {
              ...prev.custom,
              customSuggestions: freshSuggestions,
            },
          }));
        });
      }
    },
    [activeDraftId]
  );

  // Suggestion Selection
  const selectSuggestion = useCallback((id: string | null) => {
    setSelectedSuggestionId(id);
  }, []);

  // Suggestion Hover
  const hoverSuggestion = useCallback((id: string | null) => {
    setHoveredSuggestionId(id);
  }, []);

  // Accept Suggestion (Inline mutation & offset recalculation)
  const acceptSuggestion = useCallback(
    (suggestionId: string) => {
      const target = activeSuggestions.find((s) => s.id === suggestionId);
      if (!target) return;

      const { newText, updatedSuggestions } = applySuggestionReplacement(
        currentDraftState.text,
        target,
        activeSuggestions
      );

      setDraftStates((prev) => {
        const current = prev[activeDraftId];
        return {
          ...prev,
          [activeDraftId]: {
            ...current,
            text: newText,
            acceptedIds: [...current.acceptedIds, suggestionId],
            dismissedIds: current.dismissedIds.filter((id) => id !== suggestionId),
            ...(activeDraftId === "custom" ? { customSuggestions: updatedSuggestions } : {}),
          },
        };
      });

      // Auto-advance to next pending suggestion if available
      const remaining = pendingSuggestions.filter((s) => s.id !== suggestionId);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [activeDraftId, activeSuggestions, currentDraftState.text, pendingSuggestions]
  );

  // Dismiss Suggestion (Clear highlight without modifying text)
  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      setDraftStates((prev) => {
        const current = prev[activeDraftId];
        return {
          ...prev,
          [activeDraftId]: {
            ...current,
            dismissedIds: [...current.dismissedIds, suggestionId],
            acceptedIds: current.acceptedIds.filter((id) => id !== suggestionId),
          },
        };
      });

      // Auto-advance or clear selection
      const remaining = pendingSuggestions.filter((s) => s.id !== suggestionId);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [activeDraftId, pendingSuggestions]
  );

  // Accept All Suggestions
  const acceptAll = useCallback(() => {
    let textAccumulator = currentDraftState.text;
    let suggestionsAccumulator = [...activeSuggestions];

    pendingSuggestions.forEach((target) => {
      const res = applySuggestionReplacement(
        textAccumulator,
        target,
        suggestionsAccumulator
      );
      textAccumulator = res.newText;
      suggestionsAccumulator = res.updatedSuggestions;
    });

    const newAcceptedIds = [
      ...currentDraftState.acceptedIds,
      ...pendingSuggestions.map((s) => s.id),
    ];

    setDraftStates((prev) => ({
      ...prev,
      [activeDraftId]: {
        ...prev[activeDraftId],
        text: textAccumulator,
        acceptedIds: newAcceptedIds,
        dismissedIds: prev[activeDraftId].dismissedIds.filter(
          (id) => !newAcceptedIds.includes(id)
        ),
        ...(activeDraftId === "custom"
          ? { customSuggestions: suggestionsAccumulator }
          : {}),
      },
    }));

    setSelectedSuggestionId(null);
  }, [activeDraftId, activeSuggestions, currentDraftState.acceptedIds, currentDraftState.text, pendingSuggestions]);

  // Reset Draft
  const resetDraft = useCallback(() => {
    setDraftStates((prev) => ({
      ...prev,
      [activeDraftId]: {
        text: ACADEMIC_DRAFTS[activeDraftId].initialText,
        acceptedIds: [],
        dismissedIds: [],
        ...(activeDraftId === "custom" ? { customSuggestions: undefined } : {}),
      },
    }));
    setSelectedSuggestionId(null);
    setHoveredSuggestionId(null);
  }, [activeDraftId]);

  return {
    activeDraftId,
    currentDraft,
    currentText: currentDraftState.text,
    activeSuggestions,
    pendingSuggestions,
    selectedSuggestion,
    selectedSuggestionId,
    hoveredSuggestionId,
    scoreMetrics,
    textSegments,
    isCustomTyping,
    isAnalyzing: isPending,
    isDirty,
    selectDraft,
    updateText,
    selectSuggestion,
    setSelectedSuggestionId: selectSuggestion,
    hoverSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    acceptAll,
    resetDraft,
  };
}
