import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { AuditResponse } from "@/lib/types";
import type {
  EditorSuggestion,
  EditorSuggestionCategory,
  RigorMetrics,
  TextSegment,
  DocumentSection,
} from "./types";
import { adaptAuditResponseToSuggestions, computeRigorMetrics } from "./suggestionAdapter";
import {
  applySuggestionMutation,
  buildTextSegments,
  detectAcademicSections,
} from "./documentMutation";

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
  const prevAuditRef = useRef<AuditResponse | null>(initialAudit);
  const pristineTextRef = useRef<string>(initialText);

  // Sync internal text when parent initialText changes (e.g., loaded a new document)
  useEffect(() => {
    pristineTextRef.current = initialText;
    if (!isDirty) {
      setManuscriptText(initialText);
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, initialText));
      setSelectedSuggestionId(null);
    }
  }, [initialText, initialAudit, isDirty]);

  // When new audit response arrives from backend
  useEffect(() => {
    if (initialAudit && initialAudit !== prevAuditRef.current) {
      prevAuditRef.current = initialAudit;
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, manuscriptText));
      setIsDirty(false);
    }
  }, [initialAudit, manuscriptText]);

  // Compute live Rigor Metrics
  const rigorMetrics: RigorMetrics = useMemo(() => {
    return computeRigorMetrics(suggestions, initialAudit);
  }, [suggestions, initialAudit]);

  // Compute text segments for highlight rendering
  const textSegments: TextSegment[] = useMemo(() => {
    return buildTextSegments(
      manuscriptText,
      suggestions,
      selectedSuggestionId,
      hoveredSuggestionId
    );
  }, [manuscriptText, suggestions, selectedSuggestionId, hoveredSuggestionId]);

  // Detect academic sections
  const academicSections: DocumentSection[] = useMemo(() => {
    return detectAcademicSections(manuscriptText);
  }, [manuscriptText]);

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
    rigorMetrics,
    textSegments,
    academicSections,
    setActiveCategory,
    setSelectedSuggestionId,
    setHoveredSuggestionId,
    setIsCustomTyping,
    acceptSuggestion,
    dismissSuggestion,
    updateText,
    resetDraft: () => {
      setManuscriptText(pristineTextRef.current);
      setSuggestions(adaptAuditResponseToSuggestions(initialAudit, pristineTextRef.current));
      setIsDirty(false);
      setSelectedSuggestionId(null);
      onTextChange?.(pristineTextRef.current);
    },
    acceptAllInCategory,
  };
}
