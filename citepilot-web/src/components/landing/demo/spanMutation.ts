import type { DemoSuggestion, TextSegment } from "./types";

/**
 * Replaces a suggestion's target text with its recommended replacement,
 * and shifts the start/end offsets of all subsequent suggestions accordingly.
 */
export function applySuggestionReplacement(
  currentText: string,
  targetSuggestion: DemoSuggestion,
  allSuggestions: DemoSuggestion[]
): {
  newText: string;
  updatedSuggestions: DemoSuggestion[];
} {
  const originalText = targetSuggestion.originalText ?? targetSuggestion.originalSpan ?? "";
  const replacementText = targetSuggestion.replacementText ?? targetSuggestion.suggestedReplacement ?? "";
  const { startIndex, endIndex } = targetSuggestion;

  let actualStart = startIndex;
  let actualEnd = endIndex;

  // Verify boundaries match expected originalText
  if (currentText.substring(startIndex, endIndex) !== originalText) {
    // Search around expected index with 50-character window
    const searchWindow = Math.max(0, startIndex - 50);
    const foundIdx = currentText.indexOf(originalText, searchWindow);
    if (foundIdx !== -1) {
      actualStart = foundIdx;
      actualEnd = foundIdx + originalText.length;
    } else {
      // Global fallback search
      const globalIdx = currentText.indexOf(originalText);
      if (globalIdx !== -1) {
        actualStart = globalIdx;
        actualEnd = globalIdx + originalText.length;
      } else {
        // Target string not found; avoid corrupting text
        return {
          newText: currentText,
          updatedSuggestions: allSuggestions.map((s) =>
            s.id === targetSuggestion.id ? { ...s, status: "accepted" as const } : s
          ),
        };
      }
    }
  }

  const prefix = currentText.substring(0, actualStart);
  const suffix = currentText.substring(actualEnd);
  const newText = prefix + replacementText + suffix;

  const delta = replacementText.length - (actualEnd - actualStart);

  const updatedSuggestions = allSuggestions.map((s) => {
    if (s.id === targetSuggestion.id) {
      return {
        ...s,
        status: "accepted" as const,
        startIndex: actualStart,
        endIndex: actualStart + replacementText.length,
      };
    }

    if (s.startIndex >= actualEnd) {
      return {
        ...s,
        startIndex: s.startIndex + delta,
        endIndex: s.endIndex + delta,
      };
    }

    return s;
  });

  return {
    newText,
    updatedSuggestions,
  };
}

/**
 * Splits raw manuscript text and pending highlighted spans into an ordered sequence
 * of TextSegments for rendering.
 */
export function splitTextIntoSegments(
  text: string,
  suggestions: DemoSuggestion[],
  selectedId: string | null,
  hoveredId: string | null
): TextSegment[] {
  const activeHighlights = suggestions
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.startIndex - b.startIndex);

  if (activeHighlights.length === 0) {
    return [{ type: "text", key: "seg-0", content: text }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  activeHighlights.forEach((s, index) => {
    const start = Math.max(0, Math.min(s.startIndex, text.length));
    const end = Math.max(start, Math.min(s.endIndex, text.length));

    // Non-highlighted text prior to span
    if (start > cursor) {
      segments.push({
        type: "text",
        key: `text-${cursor}-${start}`,
        content: text.substring(cursor, start),
      });
    }

    // Highlighted span
    if (end > start) {
      segments.push({
        type: "highlight",
        key: `hl-${s.id}-${index}`,
        content: text.substring(start, end),
        suggestion: s,
        isSelected: s.id === selectedId,
        isHovered: s.id === hoveredId,
      });
    }

    cursor = Math.max(cursor, end);
  });

  // Trailing text segment
  if (cursor < text.length) {
    segments.push({
      type: "text",
      key: `text-${cursor}-${text.length}`,
      content: text.substring(cursor),
    });
  }

  return segments;
}
