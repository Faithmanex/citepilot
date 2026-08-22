"use client";

import React from "react";
import { DemoHighlightSpan } from "./DemoHighlightSpan";
import type { TextSegment } from "./types";

export interface DemoEditorSurfaceProps {
  currentText: string;
  textSegments: TextSegment[];
  isCustomTyping?: boolean;
  onUpdateText: (newText: string) => void;
  onSelectSuggestion: (id: string | null) => void;
  onHoverSuggestion?: (id: string | null) => void;
  className?: string;
}

export function DemoEditorSurface({
  currentText,
  textSegments,
  isCustomTyping = false,
  onUpdateText,
  onSelectSuggestion,
  onHoverSuggestion,
  className = "",
}: DemoEditorSurfaceProps) {
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = currentText.length;

  return (
    <div
      className={`bg-[#ffffff] border border-[#ebebeb] rounded-lg shadow-none flex flex-col min-h-[420px] transition-all ${className}`.trim()}
      id="demo-editor-canvas"
      data-testid="demo-editor-canvas"
    >
      {/* Editor Surface Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ebebeb] bg-[#fdfdfd] rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#027e6f] animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#545454]">
            {isCustomTyping ? "Interactive Custom Editor" : "Academic Manuscript Canvas"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#707070]">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{characterCount} chars</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {isCustomTyping ? (
          <div className="flex flex-col flex-1 gap-4">
            <div className="flex-1 flex flex-col">
              <label htmlFor="custom-manuscript-input" className="sr-only">
                Custom Academic Manuscript Text
              </label>
              <textarea
                id="custom-manuscript-input"
                data-testid="custom-manuscript-textarea"
                value={currentText}
                onChange={(e) => onUpdateText(e.target.value)}
                placeholder="Paste or type academic prose here... E.g., 'Recent empirical benchmarks indicate that RAG reduces hallucination rates by 38.2% (Urnov et al., 2010). This obviously proves beyond doubt that...'"
                rows={6}
                className="w-full flex-1 p-3.5 text-[15px] sm:text-[16px] leading-[1.65] font-sans text-[#1f243c] bg-[#f9f9f9] border border-[#d9d9d9] rounded-lg shadow-none focus:bg-[#ffffff] focus:border-[#027e6f] focus:ring-2 focus:ring-[#027e6f]/20 focus:outline-none transition-all resize-y min-h-[140px]"
              />
            </div>

            {/* Live Interactive Highlight Preview */}
            <div className="p-4 bg-[#ffffff] border border-[#ebebeb] rounded-lg shadow-none">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#707070] mb-2">
                Live Audit Preview (Click any highlight):
              </div>
              <div
                className="font-sans text-[15px] sm:text-[16px] leading-[1.75] text-[#1f243c] select-text"
                data-testid="demo-manuscript-canvas"
              >
                {textSegments.map((segment) => {
                  if (segment.type === "text") {
                    return <span key={segment.key}>{segment.content}</span>;
                  }

                  return (
                    <DemoHighlightSpan
                      key={segment.key}
                      suggestion={segment.suggestion}
                      content={segment.content}
                      isSelected={segment.isSelected}
                      isHovered={segment.isHovered}
                      onClick={onSelectSuggestion}
                      onMouseEnter={onHoverSuggestion}
                      onMouseLeave={() => onHoverSuggestion?.(null)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="font-sans text-[15px] sm:text-[16px] leading-[1.8] text-[#1f243c] select-text flex-1"
            data-testid="demo-manuscript-canvas"
          >
            {textSegments.map((segment) => {
              if (segment.type === "text") {
                return <span key={segment.key}>{segment.content}</span>;
              }

              return (
                <DemoHighlightSpan
                  key={segment.key}
                  suggestion={segment.suggestion}
                  content={segment.content}
                  isSelected={segment.isSelected}
                  isHovered={segment.isHovered}
                  onClick={onSelectSuggestion}
                  onMouseEnter={onHoverSuggestion}
                  onMouseLeave={() => onHoverSuggestion?.(null)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-[#ebebeb] bg-[#fafafa] rounded-b-lg flex items-center justify-between text-xs text-[#707070]">
        <span>Click any highlighted span to inspect the suggested revision</span>
        <span className="hidden sm:inline font-mono text-[11px]">Grammarly Editorial Engine</span>
      </div>
    </div>
  );
}

export default DemoEditorSurface;
