"use client";

import React from "react";
import type { DemoSuggestion, SuggestionCategory } from "./types";

export interface DemoHighlightSpanProps {
  suggestion: DemoSuggestion;
  content: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick: (id: string) => void;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
  className?: string;
}

const CATEGORY_STYLES: Record<
  SuggestionCategory,
  {
    base: string;
    hover: string;
    selected: string;
    border: string;
  }
> = {
  "missing-citation": {
    base: "bg-[#e6f4f2] text-[#027e6f] border-b-2 border-[#027e6f]",
    hover: "hover:bg-[#d5eee9]",
    selected: "bg-[#d5eee9] ring-2 ring-[#027e6f] ring-offset-1",
    border: "border-[#027e6f]",
  },
  "claim-needs-source": {
    base: "bg-[#fef3c7] text-[#92400e] border-b-2 border-dashed border-[#b45309]",
    hover: "hover:bg-[#fde68a]/70",
    selected: "bg-[#fde68a] ring-2 ring-[#b45309] ring-offset-1",
    border: "border-[#b45309]",
  },
  "outdated-reference": {
    base: "bg-[#ede9fe] text-[#5b21b6] border-b-2 border-dotted border-[#5b21b6]",
    hover: "hover:bg-[#ddd6fe]/70",
    selected: "bg-[#ddd6fe] ring-2 ring-[#5b21b6] ring-offset-1",
    border: "border-[#5b21b6]",
  },
  "tone-clarity": {
    base: "bg-[#f5f5f5] text-[#1f243c] border-b-2 border-[#4d536e]",
    hover: "hover:bg-[#ebebeb]",
    selected: "bg-[#ebebeb] ring-2 ring-[#4d536e] ring-offset-1",
    border: "border-[#4d536e]",
  },
};

export function DemoHighlightSpan({
  suggestion,
  content,
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = "",
}: DemoHighlightSpanProps) {
  const cStyle = CATEGORY_STYLES[suggestion.category] ?? CATEGORY_STYLES["missing-citation"];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(suggestion.id);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      id={`span-${suggestion.id}`}
      data-testid={`highlight-${suggestion.id}`}
      data-category={suggestion.category}
      aria-haspopup="dialog"
      aria-expanded={isSelected}
      aria-label={`Citation issue: ${suggestion.title}`}
      onClick={() => onClick(suggestion.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onMouseEnter?.(suggestion.id)}
      onMouseLeave={() => onMouseLeave?.()}
      className={[
        "inline px-1 py-0.5 rounded-[4px] cursor-pointer transition-all duration-150 select-text",
        cStyle.base,
        cStyle.hover,
        isSelected ? cStyle.selected : "",
        isHovered && !isSelected ? "opacity-90" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {content}
    </span>
  );
}

export default DemoHighlightSpan;
