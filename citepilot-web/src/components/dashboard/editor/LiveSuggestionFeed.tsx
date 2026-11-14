"use client";

import React from "react";
import type { EditorSuggestion } from "@/lib/editor/types";
import type { AuditSummary } from "@/lib/auditState";
import {
  Check,
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface LiveSuggestionFeedProps {
  suggestions: EditorSuggestion[];
  filteredSuggestions: EditorSuggestion[];
  selectedSuggestion: EditorSuggestion | null;
  audit: AuditSummary;
  onSelectSuggestion: (id: string | null) => void;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  onAcceptAllStyle?: () => void;
  className?: string;
}

const CATEGORY_LABELS: Record<EditorSuggestion["category"], string> = {
  citation: "Citation",
  style: "Style",
  claim: "Uncited claim",
  reference: "Reference",
};

const SEVERITY_ORDER: Record<EditorSuggestion["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const SEVERITY_STYLES: Record<EditorSuggestion["severity"], string> = {
  high: "bg-[#f3dcd6] text-[#a32b21] border-[#ddb3aa]",
  medium: "bg-[#f1e4c8] text-[#7a530c] border-[#ecd9a8]",
  low: "bg-[#e7e9f5] text-[#2c3e8c] border-[#c9cee8]",
};

export const LiveSuggestionFeed: React.FC<LiveSuggestionFeedProps> = ({
  suggestions,
  filteredSuggestions,
  selectedSuggestion,
  audit,
  onSelectSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAcceptAllStyle,
  className = "",
}) => {
  const activeSuggestions = suggestions.filter((s) => s.status === "active");
  const styleCount = activeSuggestions.filter((s) => s.category === "style").length;

  const ordered = [...filteredSuggestions].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const hasResult = audit.showsResult;

  return (
    <div
      data-testid="live-suggestion-feed"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none flex flex-col gap-4 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#221d16]">Findings</h3>
        {styleCount > 1 && onAcceptAllStyle && (
          <button
            type="button"
            onClick={onAcceptAllStyle}
            className="text-xs font-semibold text-[#2c3e8c] hover:underline min-h-11 px-2 rounded-lg cursor-pointer"
          >
            Accept all {styleCount} style fixes
          </button>
        )}
      </div>

      {!hasResult ? (
        <div className="bg-[#faf6ec] border border-dashed border-[#8f836c] rounded-lg p-6 text-center">
          <Sparkles className="w-6 h-6 text-[#5c5344] mx-auto mb-2" aria-hidden="true" />
          <p className="text-xs font-bold text-[#221d16]">No findings to show</p>
          <p className="text-[11px] text-[#5c5344] mt-1 max-w-xs mx-auto">
            {audit.phase === "running"
              ? "Findings appear when this audit finishes."
              : audit.phase === "failed"
                ? "This audit did not produce findings. Your manuscript is preserved; retry when ready."
                : "Run the audit to check this document's citations and references."}
          </p>
        </div>
      ) : selectedSuggestion && selectedSuggestion.status === "active" ? (
        <div
          data-testid="selected-suggestion-card"
          className="border border-[#2c3e8c] bg-[#faf6ec] rounded-lg p-4 space-y-3.5 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-[#f1ebdc] text-[#5c5344] border-[#d9cfb8]">
                {CATEGORY_LABELS[selectedSuggestion.category]}
              </span>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  SEVERITY_STYLES[selectedSuggestion.severity]
                }`}
              >
                {selectedSuggestion.severity}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectSuggestion(null)}
              aria-label="Close suggestion details"
              className="p-2 -m-1 min-w-11 min-h-11 flex items-center justify-center text-[#6b6152] hover:text-[#221d16] rounded-lg hover:bg-[#f1ebdc] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#221d16] font-sans">
              {selectedSuggestion.title}
            </h4>
            <p className="text-xs text-[#5c5344] mt-1 leading-relaxed">
              {selectedSuggestion.explanation}
            </p>
          </div>

          <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-md p-2.5 text-xs font-mono space-y-1.5">
            <div className="flex items-start gap-2 text-[#a32b21] bg-[#f3dcd6]/60 p-1 rounded">
              <span className="font-bold select-none" aria-hidden="true">-</span>
              <span className="line-through break-all">
                <span className="sr-only">Remove: </span>
                {selectedSuggestion.original}
              </span>
            </div>
            <div className="flex items-start gap-2 text-[#2c3e8c] bg-[#e7e9f5]/60 p-1 rounded">
              <span className="font-bold select-none" aria-hidden="true">+</span>
              <span className="font-semibold break-all">
                <span className="sr-only">Replace with: </span>
                {selectedSuggestion.replacement}
              </span>
            </div>
          </div>

          {selectedSuggestion.metadata?.crossrefVerified && (
            <div className="px-2.5 py-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-md text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-[#5c5344]">
              <span className="inline-flex items-center gap-1 text-[#2c3e8c] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verified via DOI</span>
              </span>

              {selectedSuggestion.metadata.doi && (
                <span className="text-[#2c3e8c] flex items-center gap-1 truncate max-w-[200px]">
                  <span>doi:{selectedSuggestion.metadata.doi}</span>
                </span>
              )}
            </div>
          )}

          {selectedSuggestion.educationalContext && (
            <div className="flex items-start gap-2 p-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-md text-[11px] text-[#5c5344]">
              <BookOpen className="w-3.5 h-3.5 text-[#2c3e8c] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-snug">{selectedSuggestion.educationalContext}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-testid="accept-suggestion-button"
              onClick={() => onAcceptSuggestion(selectedSuggestion.id)}
              className="flex-1 min-h-11 bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {selectedSuggestion.fixType === "insert_placeholder"
                  ? "Insert citation marker"
                  : selectedSuggestion.fixType === "correct_reference"
                    ? "Correct reference"
                    : "Apply fix"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onDismissSuggestion(selectedSuggestion.id)}
              className="min-h-11 border border-[#8f836c] hover:bg-[#faf6ec] text-[#5c5344] hover:text-[#221d16] text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      ) : activeSuggestions.length > 0 ? (
        <div
          data-testid="suggestion-card-empty"
          className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-6 shadow-none text-center flex flex-col items-center justify-center min-h-[160px] transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#d9cfb8] flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-[#2c3e8c]" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-[#14181f] mb-1">No finding selected</h4>
          <p className="text-xs text-[#5c5344] max-w-xs leading-relaxed">
            Select a highlight in the manuscript, or pick a finding below, to see
            the suggested fix.
          </p>
        </div>
      ) : null}

      {hasResult && (
        <ul
          className="space-y-2 max-h-[380px] overflow-y-auto pr-1 list-none p-0 m-0"
          aria-label="Findings list"
        >
          {ordered.length === 0 ? (
            <li className="text-center py-8 px-4 bg-[#faf6ec] border border-dashed border-[#8f836c] rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-[#2c3e8c] mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-bold text-[#221d16]">No open findings</p>
              <p className="text-[11px] text-[#5c5344] mt-0.5">
                {activeSuggestions.length === 0
                  ? "Every finding in this audit has been resolved or dismissed."
                  : "No open findings of this kind."}
              </p>
            </li>
          ) : (
            ordered.map((suggestion) => {
              const isSelected = selectedSuggestion?.id === suggestion.id;

              return (
                <li
                  key={suggestion.id}
                  data-testid={`suggestion-item-${suggestion.id}`}
                  className={`rounded-lg border transition-all flex items-stretch gap-1 ${
                    isSelected
                      ? "border-[#2c3e8c] bg-[#e7e9f5]/30"
                      : "border-[#d9cfb8] bg-[#ffffff] hover:border-[#2c3e8c]/60 hover:bg-[#faf6ec]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(suggestion.id)}
                    aria-expanded={isSelected}
                    className="flex-1 min-w-0 text-left p-3 min-h-11 cursor-pointer rounded-l-lg"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full border bg-[#f1ebdc] text-[#5c5344] border-[#d9cfb8]">
                        {CATEGORY_LABELS[suggestion.category]}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                          SEVERITY_STYLES[suggestion.severity]
                        }`}
                      >
                        {suggestion.severity}
                      </span>
                    </span>
                    <span className="block text-xs font-bold text-[#221d16] truncate mt-1">
                      {suggestion.title}
                    </span>
                    <span className="block text-[11px] text-[#5c5344] truncate font-mono">
                      &ldquo;{suggestion.original.slice(0, 45)}
                      {suggestion.original.length > 45 ? "…" : ""}&rdquo;
                    </span>
                  </button>

                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <button
                      type="button"
                      aria-label={`Apply fix for ${suggestion.title}`}
                      onClick={() => onAcceptSuggestion(suggestion.id)}
                      className="p-2 min-w-11 min-h-11 flex items-center justify-center bg-[#2c3e8c]/10 hover:bg-[#2c3e8c] text-[#2c3e8c] hover:text-white rounded-md transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-[#6b6152]" aria-hidden="true" />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default LiveSuggestionFeed;
