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

export interface RigorMetrics {
  overallScore: number;
  totalIssues: number;
  resolvedIssues: number;
  citationIntegrity: number;
  styleCompliance: number;
  claimVerification: number;
  referenceReliability: number;
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
