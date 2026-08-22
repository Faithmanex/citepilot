/**
 * Canonical types for the CitePilot Interactive Demo Editor & Rigor Scoring Engine.
 * Adheres strictly to the Grammarly Editorial Design System.
 */

export type SuggestionCategory =
  | "missing-citation"
  | "claim-needs-source"
  | "outdated-reference"
  | "tone-clarity";

export type SuggestionStatus = "pending" | "accepted" | "dismissed";

export interface SuggestionMetadata {
  authors?: string;
  year?: string | number;
  doi?: string;
  journal?: string;
  crossrefVerified?: boolean;
  ruleCode?: string;
  guidelineRef?: string;
  citationStyle?: "APA 7" | "MLA 9" | "Chicago" | "IEEE" | "Nature" | string;
}

export type ScholarlyMetadata = SuggestionMetadata;

export interface DemoSuggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  rationale: string;
  explanation?: string;
  originalText: string;
  originalSpan?: string;
  replacementText: string;
  suggestedReplacement?: string;
  status: SuggestionStatus;
  startIndex: number;
  endIndex: number;
  impactScore: number;
  metadata?: SuggestionMetadata;
}

export type Suggestion = DemoSuggestion;

export interface AcademicDraft {
  id: "lit-review" | "intro" | "discussion" | "custom";
  name: string;
  title: string;
  shortLabel?: string;
  discipline: string;
  fieldIcon?: string;
  baseScore: number;
  initialText: string;
  defaultSuggestions: DemoSuggestion[];
  suggestions?: DemoSuggestion[];
}

export interface RigorMetrics {
  overallScore: number;       // 0 - 100%
  sourceCoverage: number;     // 0 - 100%
  claimIntegrity: number;     // 0 - 100%
  scholarlyTone: number;      // 0 - 100%
  totalCount: number;
  unresolvedCount: number;
  acceptedCount: number;
  dismissedCount: number;
  statusLabel: string;
  pointsGained?: number;
  deltaScore?: number;
  isOptimal?: boolean;
}

export type TextSegment =
  | {
      type: "text";
      key: string;
      content: string;
    }
  | {
      type: "highlight";
      key: string;
      content: string;
      suggestion: DemoSuggestion;
      isSelected: boolean;
      isHovered: boolean;
    };

export interface DraftStateRecord {
  text: string;
  acceptedIds: string[];
  dismissedIds: string[];
  customSuggestions?: DemoSuggestion[];
}

export interface UseDemoEditorReturn {
  activeDraftId: AcademicDraft["id"];
  currentDraft: AcademicDraft;
  currentText: string;
  activeSuggestions: DemoSuggestion[];
  pendingSuggestions: DemoSuggestion[];
  selectedSuggestion: DemoSuggestion | null;
  selectedSuggestionId: string | null;
  hoveredSuggestionId: string | null;
  scoreMetrics: RigorMetrics;
  textSegments: TextSegment[];
  isCustomTyping: boolean;
  isAnalyzing: boolean;
  isDirty: boolean;
  selectDraft: (draftId: AcademicDraft["id"]) => void;
  updateText: (newText: string) => void;
  selectSuggestion: (id: string | null) => void;
  setSelectedSuggestionId: (id: string | null) => void;
  hoverSuggestion: (id: string | null) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  acceptAll: () => void;
  resetDraft: () => void;
}
