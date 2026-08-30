import type { EditorSuggestion, TextSegment, DocumentSection } from "./types";

/**
 * Applies a 1-click suggestion fix in-place to the manuscript string, shifting all subsequent
 * suggestion span offsets cleanly by delta.
 */
export function applySuggestionMutation(
  text: string,
  targetSuggestion: EditorSuggestion,
  suggestions: EditorSuggestion[]
): {
  newText: string;
  updatedSuggestions: EditorSuggestion[];
} {
  const { start, end } = targetSuggestion.span;

  // Boundary safety check
  if (start < 0 || end > text.length || start > end) {
    return { newText: text, updatedSuggestions: suggestions };
  }

  const prefix = text.slice(0, start);
  const suffix = text.slice(end);
  const replacement = targetSuggestion.replacement;
  const newText = prefix + replacement + suffix;

  const originalLength = end - start;
  const delta = replacement.length - originalLength;

  const updatedSuggestions = suggestions.map((s) => {
    if (s.id === targetSuggestion.id) {
      return {
        ...s,
        status: "accepted" as const,
        span: { start, end: start + replacement.length },
      };
    }

    // If suggestion is before target span, offsets are unaffected
    if (s.span.end <= start) {
      return s;
    }

    // If suggestion is strictly after target span, shift by delta
    if (s.span.start >= end) {
      return {
        ...s,
        span: {
          start: s.span.start + delta,
          end: s.span.end + delta,
        },
      };
    }

    // Partial overlap: dismiss to prevent corrupted text replacement
    return {
      ...s,
      status: "dismissed" as const,
    };
  });

  return { newText, updatedSuggestions };
}

/**
 * Converts manuscript text and active suggestion spans into a continuous array of TextSegments
 * for zero-flicker rendering in the document canvas.
 */
export function buildTextSegments(
  text: string,
  suggestions: EditorSuggestion[],
  selectedId: string | null = null,
  hoveredId: string | null = null
): TextSegment[] {
  if (!text) return [];

  // Filter only active suggestions with valid non-empty spans
  const activeSuggestions = suggestions
    .filter((s) => s.status === "active" && s.span.start < s.span.end && s.span.end <= text.length)
    .sort((a, b) => a.span.start - b.span.start);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < activeSuggestions.length; i++) {
    const s = activeSuggestions[i];

    // Check if cursor is before span start
    if (s.span.start > cursor) {
      segments.push({
        key: `text-${cursor}-${s.span.start}`,
        type: "text",
        content: text.slice(cursor, s.span.start),
      });
    }

    // Ensure span starts at or after cursor
    const validStart = Math.max(cursor, s.span.start);
    if (validStart < s.span.end) {
      segments.push({
        key: `hl-${s.id}-${validStart}`,
        type: "highlight",
        content: text.slice(validStart, s.span.end),
        suggestion: s,
        isSelected: selectedId === s.id,
        isHovered: hoveredId === s.id,
      });
      cursor = s.span.end;
    }
  }

  // Trailing text segment
  if (cursor < text.length) {
    segments.push({
      key: `text-tail-${cursor}`,
      type: "text",
      content: text.slice(cursor),
    });
  }

  return segments;
}

/**
 * Extracts academic section landmarks from manuscript text for navigation.
 */
export function detectAcademicSections(text: string): DocumentSection[] {
  if (!text) return [];

  const headingRegex = /^(?:#+\s*([^\n\r]+)|([A-Z][A-Za-z0-9\s]{2,40}))$/gm;
  const knownKeywords = [
    "abstract", "introduction", "background", "literature review",
    "methodology", "methods", "results", "discussion", "conclusion",
    "references", "bibliography", "works cited"
  ];

  const sections: DocumentSection[] = [];
  const lines = text.split("\n");
  let runningIndex = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const isMarkdownHeading = trimmed.startsWith("#");
    const isKnownSection = knownKeywords.includes(trimmed.toLowerCase());

    if (isMarkdownHeading || (isKnownSection && trimmed.length < 50)) {
      const cleanTitle = isMarkdownHeading ? trimmed.replace(/^#+\s*/, "") : trimmed;
      const level = isMarkdownHeading ? (trimmed.match(/^#+/)?.[0].length || 1) : 1;

      sections.push({
        id: `sec-${idx}-${runningIndex}`,
        title: cleanTitle,
        level,
        startIndex: runningIndex,
        endIndex: runningIndex + line.length,
      });
    }
    runningIndex += line.length + 1; // +1 for newline character
  });

  return sections;
}
