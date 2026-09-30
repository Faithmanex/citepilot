"use client";

import React from "react";
import type {
  EditorSuggestion,
  EditorSuggestionCategory,
} from "@/lib/editor/types";
import {
  Check,
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface LiveSuggestionFeedProps {
  suggestions: EditorSuggestion[];
  filteredSuggestions: EditorSuggestion[];
  selectedSuggestion: EditorSuggestion | null;
  activeCategory: EditorSuggestionCategory;
  onSelectSuggestion: (id: string | null) => void;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  onCategoryChange: (category: EditorSuggestionCategory) => void;
  onAcceptAllStyle?: () => void;
  className?: string;
}

const CATEGORY_BADGES: Record<
  EditorSuggestion["category"],
  { bg: string; text: string; border: string; label: string }
> = {
  citation: {
    bg: "bg-[#93650f]/10",
    text: "text-[#6f4c0a]",
    border: "border-[#93650f]/30",
    label: "Citation",
  },
  style: {
    bg: "bg-[#93650f]/10",
    text: "text-[#93650f]",
    border: "border-[#93650f]/30",
    label: "Style & APA",
  },
  claim: {
    bg: "bg-[#a32b21]/10",
    text: "text-[#7d1f18]",
    border: "border-[#a32b21]/30",
    label: "Uncited Claim",
  },
  reference: {
    bg: "bg-[#2c3e8c]/10",
    text: "text-[#2c3e8c]",
    border: "border-[#2c3e8c]/30",
    label: "Reference List",
  },
};

export const LiveSuggestionFeed: React.FC<LiveSuggestionFeedProps> = ({
  suggestions,
  filteredSuggestions,
  selectedSuggestion,
  activeCategory,
  onSelectSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onCategoryChange,
  onAcceptAllStyle,
  className = "",
}) => {
  const activeSuggestions = suggestions.filter((s) => s.status === "active");
  const counts = {
    all: activeSuggestions.length,
    citation: activeSuggestions.filter((s) => s.category === "citation").length,
    style: activeSuggestions.filter((s) => s.category === "style").length,
    claim: activeSuggestions.filter((s) => s.category === "claim").length,
    reference: activeSuggestions.filter((s) => s.category === "reference").length,
  };

  const categories: { id: EditorSuggestionCategory; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "citation", label: "Citations", count: counts.citation },
    { id: "style", label: "Style", count: counts.style },
    { id: "claim", label: "Claims", count: counts.claim },
    { id: "reference", label: "Refs", count: counts.reference },
  ];

  return (
    <div
      data-testid="live-suggestion-feed"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none flex flex-col gap-4 ${className}`.trim()}
    >
      {/* Category Pills Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#f1ebdc] scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#2c3e8c] text-white shadow-xs"
                  : "bg-[#faf6ec] text-[#5c5344] hover:bg-[#d9cfb8] hover:text-[#221d16]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-[#d9cfb8] text-[#948a76]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batch Action Toolbar when in Style mode */}
      {activeCategory === "style" && counts.style > 1 && onAcceptAllStyle && (
        <div className="bg-[#f1e4c8] border border-[#f1e4c8] rounded-md p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#93650f]">
            <Sparkles className="w-3.5 h-3.5 text-[#93650f]" />
            <span>{counts.style} style fixes available</span>
          </div>
          <button
            type="button"
            onClick={onAcceptAllStyle}
            className="text-xs font-bold bg-[#93650f] hover:bg-[#93650f] text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            Accept All Style
          </button>
        </div>
      )}

      {/* Active Selected Suggestion Inspection Card */}
      {selectedSuggestion && selectedSuggestion.status === "active" ? (
        <div
          data-testid="selected-suggestion-card"
          className="border-2 border-[#2c3e8c] bg-[#faf6ec] rounded-lg p-4 space-y-3.5 transition-all shadow-xs"
        >
          {/* Card Meta & Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  CATEGORY_BADGES[selectedSuggestion.category].bg
                } ${CATEGORY_BADGES[selectedSuggestion.category].text} ${
                  CATEGORY_BADGES[selectedSuggestion.category].border
                }`}
              >
                {CATEGORY_BADGES[selectedSuggestion.category].label}
              </span>
              {selectedSuggestion.ruleCode && (
                <span className="text-[10px] font-mono text-[#948a76] bg-[#f1ebdc] px-1.5 py-0.5 rounded">
                  {selectedSuggestion.ruleCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#2c3e8c] font-mono">
                +{selectedSuggestion.impactScore} Rigor
              </span>
              <button
                type="button"
                onClick={() => onSelectSuggestion(null)}
                aria-label="Close suggestion card"
                className="p-1 text-[#948a76] hover:text-[#221d16] rounded hover:bg-[#f1ebdc] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title & Explanation */}
          <div>
            <h4 className="text-xs font-bold text-[#221d16] font-sans">
              {selectedSuggestion.title}
            </h4>
            <p className="text-xs text-[#5c5344] mt-1 leading-relaxed">
              {selectedSuggestion.explanation}
            </p>
          </div>

          {/* Visual Diff Snippet */}
          <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-md p-2.5 text-xs font-mono space-y-1.5">
            <div className="flex items-start gap-2 text-[#a32b21] bg-[#f3dcd6]/60 p-1 rounded">
              <span className="font-bold select-none">-</span>
              <span className="line-through break-all">{selectedSuggestion.original}</span>
            </div>
            <div className="flex items-start gap-2 text-[#2c3e8c] bg-[#e7e9f5]/60 p-1 rounded">
              <span className="font-bold select-none">+</span>
              <span className="font-semibold break-all">{selectedSuggestion.replacement}</span>
            </div>
          </div>

          {/* Scholarly Metadata Row */}
          {selectedSuggestion.metadata && (
            <div className="px-2.5 py-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-md text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-[#5c5344]">
              <div className="flex items-center gap-1.5">
                {selectedSuggestion.metadata.crossrefVerified && (
                  <span className="inline-flex items-center gap-1 text-[#2c3e8c] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>CrossRef Verified</span>
                  </span>
                )}
                {selectedSuggestion.metadata.authors && (
                  <span className="text-[#948a76] truncate max-w-[200px]">
                    • {selectedSuggestion.metadata.authors}
                  </span>
                )}
              </div>

              {selectedSuggestion.metadata.doi && (
                <span className="text-[#2c3e8c] hover:underline flex items-center gap-1 truncate max-w-[160px]">
                  <span>doi:{selectedSuggestion.metadata.doi}</span>
                  <ExternalLink className="w-3 h-3 flex-none" />
                </span>
              )}
            </div>
          )}

          {/* Educational Note */}
          {selectedSuggestion.educationalContext && (
            <div className="flex items-start gap-2 p-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-md text-[11px] text-[#5c5344]">
              <BookOpen className="w-3.5 h-3.5 text-[#2c3e8c] shrink-0 mt-0.5" />
              <p className="leading-snug">{selectedSuggestion.educationalContext}</p>
            </div>
          )}

          {/* Card Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-testid="accept-suggestion-button"
              onClick={() => onAcceptSuggestion(selectedSuggestion.id)}
              className="flex-1 bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {selectedSuggestion.fixType === "insert_placeholder"
                  ? "Insert [citation needed]"
                  : selectedSuggestion.fixType === "correct_reference"
                  ? "Correct Reference"
                  : "Accept Fix"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onDismissSuggestion(selectedSuggestion.id)}
              className="border border-[#d9cfb8] hover:bg-[#faf6ec] text-[#5c5344] hover:text-[#221d16] text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      ) : counts.all > 0 ? (
        <div
          data-testid="suggestion-card-empty"
          className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-6 shadow-none text-center flex flex-col items-center justify-center min-h-[200px] transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#d9cfb8] flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-[#2c3e8c]" />
          </div>
          <h4 className="text-sm font-bold text-[#14181f] font-dash mb-1">
            No Citation Selected
          </h4>
          <p className="text-xs text-[#5c5344] max-w-xs leading-relaxed">
            Click any highlighted phrase in the manuscript canvas to review CitePilot&apos;s recommendations, CrossRef verification, and apply one-click fixes.
          </p>
        </div>
      ) : null}

      {/* Stream of Suggestions List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#faf6ec] border border-dashed border-[#d9cfb8] rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-[#2c3e8c] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-[#221d16]">No Active Issues</h4>
            <p className="text-[11px] text-[#948a76] mt-0.5">
              {counts.all === 0
                ? "All academic citation and style issues have been resolved."
                : "No remaining issues in this category."}
            </p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => {
            const isSelected = selectedSuggestion?.id === suggestion.id;
            const badge = CATEGORY_BADGES[suggestion.category];

            return (
              <div
                key={suggestion.id}
                data-testid={`suggestion-item-${suggestion.id}`}
                onClick={() => onSelectSuggestion(suggestion.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                  isSelected
                    ? "border-[#2c3e8c] bg-[#e7e9f5]/30 ring-1 ring-[#2c3e8c]/20"
                    : "border-[#d9cfb8] bg-[#ffffff] hover:border-[#2c3e8c]/40 hover:bg-[#faf6ec]"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#948a76] truncate">
                      {suggestion.ruleCode || "RULE"}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-[#221d16] truncate">
                    {suggestion.title}
                  </h5>
                  <p className="text-[11px] text-[#948a76] truncate font-mono">
                    "{suggestion.original.slice(0, 45)}
                    {suggestion.original.length > 45 ? "…" : ""}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    title="Accept Fix"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptSuggestion(suggestion.id);
                    }}
                    className="p-1.5 bg-[#2c3e8c]/10 hover:bg-[#2c3e8c] text-[#2c3e8c] hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-[#948a76]" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveSuggestionFeed;
