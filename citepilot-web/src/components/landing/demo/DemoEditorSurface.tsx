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
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg shadow-none flex flex-col min-h-[420px] transition-all ${className}`.trim()}
      id="demo-editor-canvas"
      data-testid="demo-editor-canvas"
    >
      {/* Editor Surface Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d9cfb8] bg-[#faf6ec] rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2c3e8c] animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5c5344]">
            {isCustomTyping ? "Interactive Custom Editor" : "Academic Manuscript Canvas"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#948a76]">
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
                className="w-full flex-1 p-3.5 text-[15px] sm:text-[16px] leading-[1.65] font-sans text-[#14181f] bg-[#faf6ec] border border-[#d9cfb8] rounded-lg shadow-none focus:bg-[#ffffff] focus:border-[#2c3e8c] focus:ring-2 focus:ring-[#2c3e8c]/20 focus:outline-none transition-all resize-y min-h-[140px]"
              />
            </div>

            {/* Live Interactive Highlight Preview */}
            <div className="p-4 bg-[#ffffff] border border-[#d9cfb8] rounded-lg shadow-none">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#948a76] mb-2">
                Live Audit Preview (Click any highlight):
              </div>
              <div
                className="font-sans text-[15px] sm:text-[16px] leading-[1.75] text-[#14181f] select-text"
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
            className="font-sans text-[15px] sm:text-[16px] leading-[1.8] text-[#14181f] select-text flex-1"
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
      <div className="px-4 py-2 border-t border-[#d9cfb8] bg-[#faf6ec] rounded-b-lg flex items-center justify-between text-xs text-[#948a76]">
        <span>Click any highlighted span to inspect the suggested revision</span>
        <span className="hidden sm:inline font-mono text-[11px]">Grammarly Editorial Engine</span>
      </div>
    </div>
  );
}

export default DemoEditorSurface;
