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
    base: "bg-[#e7e9f5] text-[#2c3e8c] border-b-2 border-[#2c3e8c]",
    hover: "hover:bg-[#e7e9f5]",
    selected: "bg-[#e7e9f5] ring-2 ring-[#2c3e8c] ring-offset-1",
    border: "border-[#2c3e8c]",
  },
  "claim-needs-source": {
    base: "bg-[#f1e4c8] text-[#93650f] border-b-2 border-dashed border-[#93650f]",
    hover: "hover:bg-[#ecd9a8]/70",
    selected: "bg-[#ecd9a8] ring-2 ring-[#93650f] ring-offset-1",
    border: "border-[#93650f]",
  },
  "outdated-reference": {
    base: "bg-[#f1e4c8] text-[#93650f] border-b-2 border-dotted border-[#93650f]",
    hover: "hover:bg-[#ecd9a8]/70",
    selected: "bg-[#ecd9a8] ring-2 ring-[#93650f] ring-offset-1",
    border: "border-[#93650f]",
  },
  "tone-clarity": {
    base: "bg-[#faf6ec] text-[#14181f] border-b-2 border-[#5c5344]",
    hover: "hover:bg-[#d9cfb8]",
    selected: "bg-[#d9cfb8] ring-2 ring-[#5c5344] ring-offset-1",
    border: "border-[#5c5344]",
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
