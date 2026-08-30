"use client";

import React from "react";
import type { EditorSuggestion } from "@/lib/editor/types";

export interface HighlightSpanProps {
  suggestion?: EditorSuggestion;
  content: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick: (id: string) => void;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
}

const CATEGORY_STYLES: Record<
  EditorSuggestion["category"],
  {
    base: string;
    selected: string;
    hover: string;
    dot: string;
    badgeLabel: string;
  }
> = {
  citation: {
    base: "border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#4c1d95]",
    selected: "bg-[#8b5cf6]/25 border-b-[3px] border-[#7c3aed] ring-2 ring-[#8b5cf6]/40",
    hover: "bg-[#8b5cf6]/20",
    dot: "bg-[#8b5cf6]",
    badgeLabel: "Citation",
  },
  style: {
    base: "border-b-2 border-[#d97706] bg-[#f59e0b]/10 text-[#78350f]",
    selected: "bg-[#f59e0b]/25 border-b-[3px] border-[#b45309] ring-2 ring-[#f59e0b]/40",
    hover: "bg-[#f59e0b]/20",
    dot: "bg-[#d97706]",
    badgeLabel: "Style",
  },
  claim: {
    base: "border-b-2 border-[#e11d48] bg-[#f43f5e]/10 text-[#881337]",
    selected: "bg-[#f43f5e]/25 border-b-[3px] border-[#be123c] ring-2 ring-[#f43f5e]/40",
    hover: "bg-[#f43f5e]/20",
    dot: "bg-[#e11d48]",
    badgeLabel: "Claim",
  },
  reference: {
    base: "border-b-2 border-[#027e6f] bg-[#027e6f]/10 text-[#024a41]",
    selected: "bg-[#027e6f]/25 border-b-[3px] border-[#02665a] ring-2 ring-[#027e6f]/40",
    hover: "bg-[#027e6f]/20",
    dot: "bg-[#027e6f]",
    badgeLabel: "Reference",
  },
};

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  suggestion,
  content,
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!suggestion) {
    return <span>{content}</span>;
  }

  const categoryConfig =
    CATEGORY_STYLES[suggestion.category] || CATEGORY_STYLES.style;

  const activeClasses = isSelected
    ? categoryConfig.selected
    : isHovered
    ? categoryConfig.hover
    : categoryConfig.base;

  return (
    <mark
      data-testid={`highlight-span-${suggestion.id}`}
      tabIndex={0}
      role="button"
      aria-label={`${categoryConfig.badgeLabel} warning on: "${content}". Click to view fix suggestion.`}
      className={`relative inline cursor-pointer rounded-xs px-1 py-0.5 font-sans transition-all duration-150 outline-none ${activeClasses}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(suggestion.id);
      }}
      onMouseEnter={() => onMouseEnter?.(suggestion.id)}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(suggestion.id);
        }
      }}
    >
      <span>{content}</span>
      {isSelected && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ml-1 align-middle ${categoryConfig.dot} animate-pulse`}
          aria-hidden="true"
        />
      )}
    </mark>
  );
};

export default HighlightSpan;
