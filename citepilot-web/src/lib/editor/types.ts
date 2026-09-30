export type EditorSuggestionCategory = "all" | "citation" | "style" | "claim" | "reference";

export type EditorSuggestionFixType =
  | "replace"
  | "insert_placeholder"
  | "correct_reference";

export interface HighlightSpan {
  start: number;
  end: number;
}

export interface EditorSuggestion {
  id: string;
  category: "citation" | "style" | "claim" | "reference";
  fixType: EditorSuggestionFixType;
  original: string;
  replacement: string;
  span: HighlightSpan;
  title: string;
  explanation: string;
  educationalContext?: string;
  ruleCode?: string;
  severity: "high" | "medium" | "low";
  impactScore: number;
  status: "active" | "accepted" | "dismissed";
  paragraphIndex?: number;
  metadata?: {
    doi?: string;
    authors?: string;
    crossrefVerified?: boolean;
    guidelineRef?: string;
    ruleCode?: string;
    citationStyle?: string;
    [key: string]: unknown;
  };
}

export interface FindingsCategoryCounts {
  citation: number;
  style: number;
  claim: number;
  reference: number;
}

/**
 * Honest, count-based summary of an audit. Deliberately contains no composite
 * 0-100 score: the previous score was a heuristic weighting that could report a
 * perfect result for unverified work. These are raw tallies an author can trace
 * back to a specific finding.
 */
export interface FindingsSummary {
  total: number;
  active: number;
  resolved: number;
  byCategory: FindingsCategoryCounts;
}

export interface TextSegment {
  key: string;
  type: "text" | "highlight";
  content: string;
  suggestion?: EditorSuggestion;
  isSelected?: boolean;
  isHovered?: boolean;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  startIndex: number;
  endIndex: number;
}
