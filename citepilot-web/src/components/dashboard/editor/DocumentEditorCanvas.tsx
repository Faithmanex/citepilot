"use client";

import React from "react";
import type { TextSegment } from "@/lib/editor/types";
import { HighlightSpan } from "./HighlightSpan";
import { LexicalDocumentCanvas } from "./lexical";

export interface DocumentEditorCanvasProps {
  currentText: string;
  initialHtml?: string;
  textSegments: TextSegment[];
  isCustomTyping: boolean;
  onUpdateText: (newText: string) => void;
  onSelectSuggestion: (id: string | null) => void;
  onHoverSuggestion?: (id: string | null) => void;
  className?: string;
}

export const DocumentEditorCanvas: React.FC<DocumentEditorCanvasProps> = ({
  currentText,
  initialHtml,
  textSegments,
  isCustomTyping,
  onUpdateText,
  onSelectSuggestion,
  onHoverSuggestion,
  className = "",
}) => {
  const words = currentText.trim().split(/\s+/).filter(Boolean).length;
  const chars = currentText.length;

  return (
    <div
      data-testid="document-editor-canvas"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg shadow-none flex flex-col min-h-[560px] transition-all ${className}`.trim()}
    >
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#d9cfb8] bg-[#faf6ec] rounded-t-lg gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCustomTyping ? "bg-[#93650f]" : "bg-[#2c3e8c]"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-[#14181f]">
              {isCustomTyping ? "Editing" : "Manuscript"}
            </span>
          </div>
        </div>

        {/* Word / character count */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#948a76]">
          <span className="font-semibold text-[#221d16]">{words}</span>
          <span>words</span>
          <span>•</span>
          <span className="font-semibold text-[#221d16]">{chars}</span>
          <span>chars</span>
        </div>
      </div>

      {/* Document body — rendered as a Word-style page */}
      <div className="doc-shell flex-1">
        {isCustomTyping ? (
          <LexicalDocumentCanvas
            initialText={currentText}
            initialHtml={initialHtml}
            onUpdateText={onUpdateText}
            onInspectSelection={(selectedText) => {
              const match = textSegments.find(
                (s) => s.type === "highlight" && s.content.includes(selectedText.trim())
              );
              if (match?.suggestion) {
                onSelectSuggestion(match.suggestion.id);
              }
            }}
          />
        ) : (
          <article
            data-testid="interactive-manuscript-canvas"
            className="doc-page whitespace-pre-wrap select-text"
          >
            {textSegments.length === 0 ? (
              <p className="text-[#948a76] italic">No document text loaded.</p>
            ) : (
              textSegments.map((segment) => {
                if (segment.type === "text") {
                  return <span key={segment.key}>{segment.content}</span>;
                }
                return (
                  <HighlightSpan
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
              })
            )}
          </article>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="px-5 py-2.5 border-t border-[#d9cfb8] bg-[#faf6ec] rounded-b-lg flex flex-wrap items-center justify-between text-xs text-[#948a76] gap-2">
        <span>Click a highlight to see the suggested fix</span>
      </div>
    </div>
  );
};

export default DocumentEditorCanvas;
