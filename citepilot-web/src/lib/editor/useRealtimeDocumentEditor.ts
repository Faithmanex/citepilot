import { useState, useCallback, useMemo, useRef } from "react";
import type { AuditResponse } from "@/lib/types";
import type {
  EditorSuggestion,
  EditorSuggestionCategory,
  FindingsSummary,
  TextSegment,
} from "./types";
import { adaptAuditResponseToSuggestions, summarizeFindings } from "./suggestionAdapter";
import { applySuggestionMutation, buildTextSegments } from "./documentMutation";

export interface UseRealtimeDocumentEditorOptions {
  initialText: string;
  initialAudit: AuditResponse | null;
  onTextChange?: (newText: string) => void;
  onRequestReAudit?: (newText: string) => void;
}

export function useRealtimeDocumentEditor({
  initialText,
  initialAudit,
  onTextChange,
  onRequestReAudit,
}: UseRealtimeDocumentEditorOptions) {
  const [manuscriptText, setManuscriptText] = useState(initialText);
  const [suggestions, setSuggestions] = useState<EditorSuggestion[]>(() =>
    adaptAuditResponseToSuggestions(initialAudit, initialText)
  );
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<EditorSuggestionCategory>("all");
  const [isCustomTyping, setIsCustomTyping] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Debounced re-audit timer ref (2.5s idle)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pristineText, setPristineText] = useState(initialText);

  // Adjust state while rendering when the parent supplies a new document or a
  // new audit response. This is React's documented pattern for resetting state
  // on prop change and avoids a setState-in-effect cascade.
  const [syncedInputs, setSyncedInputs] = useState<{
    text: string;
    audit: AuditResponse | null;
  }>({ text: initialText, audit: initialAudit });

  if (initialText !== syncedInputs.text) {
    setSyncedInputs({ text: initialText, audit: initialAudit });
    setPristineText(initialText);
    if (!isDirty) {
      setManuscriptText(initialText);
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, initialText));
      setSelectedSuggestionId(null);
    }
  } else if (initialAudit !== syncedInputs.audit) {
    setSyncedInputs({ text: initialText, audit: initialAudit });
    if (initialAudit) {
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, manuscriptText));
      setIsDirty(false);
    }
  }

  // Compute honest findings tallies
  const findings: FindingsSummary = useMemo(() => {
    return summarizeFindings(suggestions);
  }, [suggestions]);

  // Compute text segments for highlight rendering
  const textSegments: TextSegment[] = useMemo(() => {
    return buildTextSegments(
      manuscriptText,
      suggestions,
      selectedSuggestionId,
      hoveredSuggestionId
    );
  }, [manuscriptText, suggestions, selectedSuggestionId, hoveredSuggestionId]);

  // Filtered suggestions based on active category
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (s.status !== "active") return false;
      if (activeCategory === "all") return true;
      return s.category === activeCategory;
    });
  }, [suggestions, activeCategory]);

  // Selected suggestion object
  const selectedSuggestion = useMemo(() => {
    return suggestions.find((s) => s.id === selectedSuggestionId) || null;
  }, [suggestions, selectedSuggestionId]);

  // Accept a single suggestion
  const acceptSuggestion = useCallback(
    (id: string) => {
      const target = suggestions.find((s) => s.id === id);
      if (!target) return;

      const { newText, updatedSuggestions } = applySuggestionMutation(
        manuscriptText,
        target,
        suggestions
      );

      setManuscriptText(newText);
      setSuggestions(updatedSuggestions);
      setIsDirty(true);
      onTextChange?.(newText);

      // Select next active suggestion in current filtered list if available
      const remaining = updatedSuggestions.filter(
        (s) => s.status === "active" && (activeCategory === "all" || s.category === activeCategory)
      );
      if (remaining.length > 0) {
        setSelectedSuggestionId(remaining[0].id);
      } else {
        setSelectedSuggestionId(null);
      }
    },
    [manuscriptText, suggestions, activeCategory, onTextChange]
  );

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "dismissed" as const } : s))
    );
    setSelectedSuggestionId((current) => (current === id ? null : current));
  }, []);

  // Update text directly (typing mode)
  const updateText = useCallback(
    (newText: string) => {
      setManuscriptText(newText);
      setIsDirty(true);
      onTextChange?.(newText);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Trigger debounced re-audit after 2500ms of user idle
      debounceTimerRef.current = setTimeout(() => {
        onRequestReAudit?.(newText);
      }, 2500);
    },
    [onTextChange, onRequestReAudit]
  );

  // Accept all suggestions in the active category (e.g. bulk style fixes)
  const acceptAllInCategory = useCallback(
    (category: EditorSuggestionCategory) => {
      let currentString = manuscriptText;
      let currentList = [...suggestions];

      const targets = currentList.filter(
        (s) => s.status === "active" && (category === "all" || s.category === category)
      );

      targets.forEach((target) => {
        // Re-find target in latest mutated list
        const liveTarget = currentList.find((s) => s.id === target.id);
        if (liveTarget && liveTarget.status === "active") {
          const res = applySuggestionMutation(currentString, liveTarget, currentList);
          currentString = res.newText;
          currentList = res.updatedSuggestions;
        }
      });

      setManuscriptText(currentString);
      setSuggestions(currentList);
      setIsDirty(true);
      setSelectedSuggestionId(null);
      onTextChange?.(currentString);
    },
    [manuscriptText, suggestions, onTextChange]
  );

  return {
    manuscriptText,
    suggestions,
    filteredSuggestions,
    selectedSuggestion,
    selectedSuggestionId,
    hoveredSuggestionId,
    activeCategory,
    isCustomTyping,
    isDirty,
    findings,
    textSegments,
    setActiveCategory,
    setSelectedSuggestionId,
    setHoveredSuggestionId,
    setIsCustomTyping,
    acceptSuggestion,
    dismissSuggestion,
    updateText,
    resetDraft: () => {
      setManuscriptText(pristineText);
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, pristineText));
      setIsDirty(false);
      setSelectedSuggestionId(null);
      onTextChange?.(pristineText);
    },
    acceptAllInCategory,
  };
}
