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
    bg: "bg-[#8b5cf6]/10",
    text: "text-[#7c3aed]",
    border: "border-[#8b5cf6]/30",
    label: "Citation",
  },
  style: {
    bg: "bg-[#f59e0b]/10",
    text: "text-[#b45309]",
    border: "border-[#f59e0b]/30",
    label: "Style & APA",
  },
  claim: {
    bg: "bg-[#f43f5e]/10",
    text: "text-[#be123c]",
    border: "border-[#f43f5e]/30",
    label: "Uncited Claim",
  },
  reference: {
    bg: "bg-[#027e6f]/10",
    text: "text-[#027e6f]",
    border: "border-[#027e6f]/30",
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
      className={`bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none flex flex-col gap-4 ${className}`.trim()}
    >
      {/* Category Pills Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#f0f0f0] scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#027e6f] text-white shadow-xs"
                  : "bg-[#f5f5f5] text-[#545454] hover:bg-[#ebebeb] hover:text-[#0e101a]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-[#e5e5e5] text-[#707070]"
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
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-md p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#92400e]">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            <span>{counts.style} style fixes available</span>
          </div>
          <button
            type="button"
            onClick={onAcceptAllStyle}
            className="text-xs font-bold bg-[#d97706] hover:bg-[#b45309] text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            Accept All Style
          </button>
        </div>
      )}

      {/* Active Selected Suggestion Inspection Card */}
      {selectedSuggestion && selectedSuggestion.status === "active" ? (
        <div
          data-testid="selected-suggestion-card"
          className="border-2 border-[#027e6f] bg-[#fcfdfd] rounded-lg p-4 space-y-3.5 transition-all shadow-xs"
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
                <span className="text-[10px] font-mono text-[#707070] bg-[#f0f0f0] px-1.5 py-0.5 rounded">
                  {selectedSuggestion.ruleCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#027e6f] font-mono">
                +{selectedSuggestion.impactScore} Rigor
              </span>
              <button
                type="button"
                onClick={() => onSelectSuggestion(null)}
                aria-label="Close suggestion card"
                className="p-1 text-[#707070] hover:text-[#0e101a] rounded hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title & Explanation */}
          <div>
            <h4 className="text-xs font-bold text-[#0e101a] font-sans">
              {selectedSuggestion.title}
            </h4>
            <p className="text-xs text-[#545454] mt-1 leading-relaxed">
              {selectedSuggestion.explanation}
            </p>
          </div>

          {/* Visual Diff Snippet */}
          <div className="bg-[#ffffff] border border-[#ebebeb] rounded-md p-2.5 text-xs font-mono space-y-1.5">
            <div className="flex items-start gap-2 text-[#b91c1c] bg-[#fff1f2]/60 p-1 rounded">
              <span className="font-bold select-none">-</span>
              <span className="line-through break-all">{selectedSuggestion.original}</span>
            </div>
            <div className="flex items-start gap-2 text-[#027e6f] bg-[#e6f4f2]/60 p-1 rounded">
              <span className="font-bold select-none">+</span>
              <span className="font-semibold break-all">{selectedSuggestion.replacement}</span>
            </div>
          </div>

          {/* Scholarly Metadata Row */}
          {selectedSuggestion.metadata && (
            <div className="px-2.5 py-2 bg-[#fdfdfd] border border-[#ebebeb] rounded-md text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-[#545454]">
              <div className="flex items-center gap-1.5">
                {selectedSuggestion.metadata.crossrefVerified && (
                  <span className="inline-flex items-center gap-1 text-[#027e6f] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>CrossRef Verified</span>
                  </span>
                )}
                {selectedSuggestion.metadata.authors && (
                  <span className="text-[#707070] truncate max-w-[200px]">
                    • {selectedSuggestion.metadata.authors}
                  </span>
                )}
              </div>

              {selectedSuggestion.metadata.doi && (
                <span className="text-[#027e6f] hover:underline flex items-center gap-1 truncate max-w-[160px]">
                  <span>doi:{selectedSuggestion.metadata.doi}</span>
                  <ExternalLink className="w-3 h-3 flex-none" />
                </span>
              )}
            </div>
          )}

          {/* Educational Note */}
          {selectedSuggestion.educationalContext && (
            <div className="flex items-start gap-2 p-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-md text-[11px] text-[#4b5563]">
              <BookOpen className="w-3.5 h-3.5 text-[#027e6f] shrink-0 mt-0.5" />
              <p className="leading-snug">{selectedSuggestion.educationalContext}</p>
            </div>
          )}

          {/* Card Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-testid="accept-suggestion-button"
              onClick={() => onAcceptSuggestion(selectedSuggestion.id)}
              className="flex-1 bg-[#027e6f] hover:bg-[#02665a] text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
              className="border border-[#d9d9d9] hover:bg-[#f5f5f5] text-[#545454] hover:text-[#0e101a] text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Stream of Suggestions List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#fafafa] border border-dashed border-[#e5e5e5] rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-[#027e6f] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-[#0e101a]">No Active Issues</h4>
            <p className="text-[11px] text-[#707070] mt-0.5">
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
                    ? "border-[#027e6f] bg-[#e6f4f2]/30 ring-1 ring-[#027e6f]/20"
                    : "border-[#ebebeb] bg-[#ffffff] hover:border-[#027e6f]/40 hover:bg-[#fcfdfd]"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#707070] truncate">
                      {suggestion.ruleCode || "RULE"}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-[#0e101a] truncate">
                    {suggestion.title}
                  </h5>
                  <p className="text-[11px] text-[#707070] truncate font-mono">
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
                    className="p-1.5 bg-[#027e6f]/10 hover:bg-[#027e6f] text-[#027e6f] hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-[#a3a3a3]" />
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
