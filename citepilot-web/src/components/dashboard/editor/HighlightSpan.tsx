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
    base: "border-b-2 border-[#93650f] bg-[#93650f]/10 text-[#523a06]",
    selected: "bg-[#93650f]/25 border-b-[3px] border-[#6f4c0a] ring-2 ring-[#93650f]/40",
    hover: "bg-[#93650f]/20",
    dot: "bg-[#93650f]",
    badgeLabel: "Citation",
  },
  style: {
    base: "border-b-2 border-[#93650f] bg-[#93650f]/10 text-[#6f4c0a]",
    selected: "bg-[#93650f]/25 border-b-[3px] border-[#93650f] ring-2 ring-[#93650f]/40",
    hover: "bg-[#93650f]/20",
    dot: "bg-[#93650f]",
    badgeLabel: "Style",
  },
  claim: {
    base: "border-b-2 border-[#a32b21] bg-[#a32b21]/10 text-[#6e1a13]",
    selected: "bg-[#a32b21]/25 border-b-[3px] border-[#7d1f18] ring-2 ring-[#a32b21]/40",
    hover: "bg-[#a32b21]/20",
    dot: "bg-[#a32b21]",
    badgeLabel: "Claim",
  },
  reference: {
    base: "border-b-2 border-[#2c3e8c] bg-[#2c3e8c]/10 text-[#2c3e8c]",
    selected: "bg-[#2c3e8c]/25 border-b-[3px] border-[#24357a] ring-2 ring-[#2c3e8c]/40",
    hover: "bg-[#2c3e8c]/20",
    dot: "bg-[#2c3e8c]",
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
