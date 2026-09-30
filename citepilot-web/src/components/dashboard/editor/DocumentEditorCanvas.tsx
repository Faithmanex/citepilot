"use client";

import React from "react";
import type { TextSegment, DocumentSection } from "@/lib/editor/types";
import { HighlightSpan } from "./HighlightSpan";
import { LexicalDocumentCanvas } from "./lexical";
import { Edit3, Eye, Sparkles, Hash } from "lucide-react";

export interface DocumentEditorCanvasProps {
  currentText: string;
  initialHtml?: string;
  textSegments: TextSegment[];
  sections?: DocumentSection[];
  isCustomTyping: boolean;
  onUpdateText: (newText: string) => void;
  onToggleCustomTyping: (enabled: boolean) => void;
  onSelectSuggestion: (id: string | null) => void;
  onHoverSuggestion?: (id: string | null) => void;
  className?: string;
}

export const DocumentEditorCanvas: React.FC<DocumentEditorCanvasProps> = ({
  currentText,
  initialHtml,
  textSegments,
  sections = [],
  isCustomTyping,
  onUpdateText,
  onToggleCustomTyping,
  onSelectSuggestion,
  onHoverSuggestion,
  className = "",
}) => {
  const words = currentText.trim().split(/\s+/).filter(Boolean).length;
  const chars = currentText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 225));

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
              } animate-pulse`}
              aria-hidden="true"
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#14181f]">
              {isCustomTyping ? "Direct Prose Editing" : "Academic Manuscript Canvas"}
            </span>
          </div>

          {/* Section Indicator Landmark */}
          {sections.length > 0 && !isCustomTyping && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#948a76] bg-[#f1ebdc] px-2 py-0.5 rounded font-mono">
              <Hash className="w-3 h-3 text-[#5c5344]" />
              <span>{sections.length} Academic Sections</span>
            </div>
          )}
        </div>

        {/* Word count & Mode toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#948a76]">
            <span className="font-semibold text-[#221d16]">{words}</span>
            <span>words</span>
            <span>•</span>
            <span className="font-semibold text-[#221d16]">{chars}</span>
            <span>chars</span>
            <span className="hidden md:inline">• ~{readingTimeMinutes} min read</span>
          </div>

          <button
            type="button"
            data-testid="toggle-edit-mode-btn"
            onClick={() => onToggleCustomTyping(!isCustomTyping)}
            className="text-xs font-bold px-3 py-1.5 rounded-md border border-[#d9cfb8] hover:border-[#2c3e8c] hover:text-[#2c3e8c] bg-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isCustomTyping ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View Highlights</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Prose</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        {isCustomTyping ? (
          <div className="flex flex-col flex-1 gap-5">
            <div className="flex-1 flex flex-col">
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
            </div>

            {/* Live Highlight Preview Underneath Lexical Canvas */}
            <div className="p-4 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[#948a76]">
                <span>Live Audit Preview (Click any highlight):</span>
                <span className="text-[#2c3e8c] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-syncing
                </span>
              </div>
              <div
                className="font-sans text-[15px] leading-[1.75] text-[#14181f] select-text"
                data-testid="interactive-manuscript-preview"
              >
                {textSegments.map((segment) => {
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
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="interactive-manuscript-canvas"
            className="font-sans text-[15px] sm:text-[16px] leading-[1.8] text-[#14181f] select-text flex-1 whitespace-pre-wrap"
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
          </div>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="px-5 py-2.5 border-t border-[#d9cfb8] bg-[#faf6ec] rounded-b-lg flex flex-wrap items-center justify-between text-xs text-[#948a76] gap-2">
        <div className="flex items-center gap-3">
          <span>Click any colored span to inspect and accept 1-click fixes</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Realtime Manuscript Engine</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorCanvas;
