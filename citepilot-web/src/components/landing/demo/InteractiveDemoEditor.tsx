"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { DocumentEditorCanvas } from "@/components/dashboard/editor/DocumentEditorCanvas";
import { FindingsSummaryWidget } from "@/components/dashboard/editor/RigorScoreWidget";
import { LiveSuggestionFeed } from "@/components/dashboard/editor/LiveSuggestionFeed";
import { useDemoEditor } from "./useDemoEditor";

export interface InteractiveDemoEditorProps {
  defaultDraftId?: string;
  className?: string;
}

/**
 * The landing demo is a read-only, faithful preview of the production
 * workspace. It renders the same canvas, findings summary, and findings list
 * the dashboard uses, driven by a worked example — never by client-side
 * heuristics or invented citations.
 */
export function InteractiveDemoEditor({
  defaultDraftId,
  className = "",
}: InteractiveDemoEditorProps) {
  const {
    activeExampleId,
    examples,
    text,
    suggestions,
    activeSuggestions,
    selectedSuggestion,
    findings,
    textSegments,
    isDirty,
    selectExample,
    acceptSuggestion,
    dismissSuggestion,
    acceptAllStyle,
    reset,
    selectSuggestion,
    hoverSuggestion,
  } = useDemoEditor(defaultDraftId);

  return (
    <section
      data-testid="interactive-demo-editor"
      aria-label="CitePilot example audit"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        {/* Example switcher + reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Example documents">
            {examples.map((example) => {
              const isActive = example.id === activeExampleId;
              return (
                <button
                  key={example.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`demo-example-${example.id}`}
                  onClick={() => selectExample(example.id)}
                  className={[
                    "h-9 px-3.5 text-xs font-bold rounded-lg border shadow-none transition-all cursor-pointer select-none",
                    isActive
                      ? "bg-[#ffffff] text-[#221d16] border-[#d9cfb8]"
                      : "bg-transparent text-[#5c5344] border-transparent hover:text-[#221d16] hover:bg-[#d9cfb8]",
                  ].join(" ")}
                >
                  {example.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={!isDirty}
            data-testid="demo-reset-btn"
            aria-label="Reset example"
            className={[
              "h-9 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors select-none",
              isDirty
                ? "text-[#5c5344] hover:text-[#221d16] border-[#d9cfb8] bg-[#ffffff] hover:bg-[#d9cfb8] cursor-pointer"
                : "text-[#d9cfb8] border-transparent bg-transparent cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <p className="text-xs text-[#5c5344]">
          Example document. Click a highlight to see the fix.
        </p>

        {/* Document + findings split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <div className="lg:col-span-7 w-full">
            <DocumentEditorCanvas
              currentText={text}
              textSegments={textSegments}
              isCustomTyping={false}
              onUpdateText={() => {}}
              onSelectSuggestion={selectSuggestion}
              onHoverSuggestion={hoverSuggestion}
            />
          </div>

          <div className="lg:col-span-5 w-full flex flex-col gap-5">
            <FindingsSummaryWidget summary={findings} />

            <LiveSuggestionFeed
              suggestions={suggestions}
              filteredSuggestions={activeSuggestions}
              selectedSuggestion={selectedSuggestion}
              onSelectSuggestion={selectSuggestion}
              onAcceptSuggestion={acceptSuggestion}
              onDismissSuggestion={dismissSuggestion}
              onAcceptAllStyle={acceptAllStyle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default InteractiveDemoEditor;
