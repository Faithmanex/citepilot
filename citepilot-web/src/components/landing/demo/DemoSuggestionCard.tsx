"use client";

import React, { useEffect, useCallback } from "react";
import { Check, X, ShieldCheck, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DemoSuggestion } from "./types";

export interface DemoSuggestionCardProps {
  suggestion: DemoSuggestion | null;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "missing-citation": "Missing Citation",
  "claim-needs-source": "Claim Needs Source",
  "outdated-reference": "Outdated Reference",
  "tone-clarity": "Tone & Clarity",
};

export function DemoSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onClose,
  className = "",
}: DemoSuggestionCardProps) {
  // Keyboard navigation shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!suggestion) return;

      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        onAccept(suggestion.id);
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        onDismiss(suggestion.id);
      }
    },
    [suggestion, onAccept, onDismiss, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!suggestion) {
    return (
      <div
        className={`bg-[#f5f5f5] border border-[#ebebeb] rounded-lg p-6 shadow-none text-center flex flex-col items-center justify-center min-h-[220px] transition-all ${className}`.trim()}
        data-testid="suggestion-card-empty"
      >
        <div className="w-10 h-10 rounded-lg bg-[#ebebeb] flex items-center justify-center text-[#707070] mb-3">
          <Sparkles className="w-5 h-5 text-[#027e6f]" />
        </div>
        <h4 className="text-sm font-bold text-[#1f243c] font-dash mb-1">
          No Citation Selected
        </h4>
        <p className="text-xs text-[#545454] max-w-xs leading-relaxed">
          Click any highlighted phrase in the manuscript canvas to review CitePilot&apos;s recommendations, CrossRef verification, and apply one-click fixes.
        </p>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[suggestion.category] ?? "Citation Advisory";

  return (
    <div
      role="region"
      aria-label={`Suggestion details for ${categoryLabel}`}
      data-testid="demo-suggestion-card"
      className={`bg-[#ffffff] border border-[#d9d9d9] rounded-lg p-4 sm:p-5 shadow-none flex flex-col gap-3.5 transition-all ${className}`.trim()}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant={suggestion.category}
          size="sm"
          fontMono
          uppercase
          dot
          className="rounded-[6px]"
        >
          {categoryLabel}
        </Badge>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suggestion card"
            className="w-7 h-7 rounded-lg text-[#707070] hover:text-[#0e101a] hover:bg-[#ebebeb] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Title and Educational Rationale */}
      <div>
        <h4 className="text-sm font-bold font-dash text-[#1f243c] tracking-tight">
          {suggestion.title}
        </h4>
        <p className="text-xs text-[#545454] leading-relaxed mt-1">
          {suggestion.rationale}
        </p>
      </div>

      {/* Diff & Citation Comparison Block */}
      <div className="bg-[#f5f5f5] border border-[#ebebeb] rounded-lg p-3 space-y-2 text-xs">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#707070] mb-0.5">
            Original Text:
          </div>
          <div className="text-[#545454] line-through decoration-red-500/70 font-sans leading-relaxed">
            {suggestion.originalText}
          </div>
        </div>

        <div className="pt-2 border-t border-[#ebebeb]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#027e6f] mb-0.5">
            Recommended Revision:
          </div>
          <div className="text-[#0e101a] font-semibold font-sans leading-relaxed">
            {suggestion.replacementText}
          </div>
        </div>
      </div>

      {/* Scholarly Metadata Row */}
      {suggestion.metadata && (
        <div className="px-2.5 py-2 bg-[#fdfdfd] border border-[#ebebeb] rounded-lg text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-[#545454]">
          <div className="flex items-center gap-1.5">
            {suggestion.metadata.crossrefVerified && (
              <span className="inline-flex items-center gap-1 text-[#027e6f] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CrossRef Verified</span>
              </span>
            )}
            {suggestion.metadata.authors && (
              <span className="text-[#707070] truncate max-w-[180px]">
                • {suggestion.metadata.authors}
              </span>
            )}
          </div>

          {suggestion.metadata.doi && (
            <span className="text-[#027e6f] hover:underline flex items-center gap-1 truncate max-w-[150px]">
              <span>doi:{suggestion.metadata.doi}</span>
              <ExternalLink className="w-3 h-3 flex-none" />
            </span>
          )}
        </div>
      )}

      {/* Action Button Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ebebeb]">
        <button
          type="button"
          onClick={() => onDismiss(suggestion.id)}
          className="h-8 px-3 text-xs font-bold rounded-lg border border-[#d9d9d9] bg-[#ffffff] text-[#545454] hover:text-[#0e101a] hover:bg-[#ebebeb] transition-colors cursor-pointer shadow-none flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>

        <button
          type="button"
          onClick={() => onAccept(suggestion.id)}
          className="h-8 px-4 text-xs font-bold rounded-lg bg-[#027e6f] hover:bg-[#02665a] text-white border-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Accept Fix</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
}

export default DemoSuggestionCard;
