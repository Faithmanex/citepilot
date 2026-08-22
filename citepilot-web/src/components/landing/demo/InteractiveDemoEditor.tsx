"use client";

import React, { useEffect } from "react";
import { useDemoEditor } from "./useDemoEditor";
import { DemoDraftSelector } from "./DemoDraftSelector";
import { DemoEditorSurface } from "./DemoEditorSurface";
import { DemoScoreCounter } from "./DemoScoreCounter";
import { DemoSuggestionCard } from "./DemoSuggestionCard";
import type { AcademicDraft, RigorMetrics } from "./types";

export interface InteractiveDemoEditorProps {
  defaultDraftId?: AcademicDraft["id"];
  className?: string;
  onScoreChange?: (metrics: RigorMetrics) => void;
  onDraftChange?: (draftId: AcademicDraft["id"]) => void;
}

export function InteractiveDemoEditor({
  defaultDraftId = "lit-review",
  className = "",
  onScoreChange,
  onDraftChange,
}: InteractiveDemoEditorProps) {
  const {
    activeDraftId,
    currentText,
    textSegments,
    selectedSuggestion,
    scoreMetrics,
    isCustomTyping,
    isDirty,
    selectDraft,
    updateText,
    selectSuggestion,
    hoverSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    resetDraft,
  } = useDemoEditor(defaultDraftId);

  // Notify parent component of score and draft changes
  useEffect(() => {
    onScoreChange?.(scoreMetrics);
  }, [scoreMetrics, onScoreChange]);

  const handleSelectDraft = (draftId: AcademicDraft["id"]) => {
    selectDraft(draftId);
    onDraftChange?.(draftId);
  };

  return (
    <section
      data-testid="interactive-demo-editor"
      aria-label="CitePilot Live Interactive Citation Demo"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        {/* Top Segmented Draft Switcher & Reset Action */}
        <DemoDraftSelector
          activeDraftId={activeDraftId}
          onSelectDraft={handleSelectDraft}
          onReset={resetDraft}
          isDirty={isDirty}
        />

        {/* Responsive Desktop 60/40 Split & Mobile Docked Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Canvas Pane (60% / col-span-7) */}
          <div className="lg:col-span-7 w-full">
            <DemoEditorSurface
              currentText={currentText}
              textSegments={textSegments}
              isCustomTyping={isCustomTyping}
              onUpdateText={updateText}
              onSelectSuggestion={selectSuggestion}
              onHoverSuggestion={hoverSuggestion}
            />
          </div>

          {/* Right Inspection & Rigor Score Pane (40% / col-span-5) */}
          <div className="lg:col-span-5 w-full flex flex-col gap-5">
            {/* Rigor Score Counter & Sub-Metrics */}
            <DemoScoreCounter metrics={scoreMetrics} />

            {/* Active Suggestion Diff Card */}
            <DemoSuggestionCard
              suggestion={selectedSuggestion}
              onAccept={acceptSuggestion}
              onDismiss={dismissSuggestion}
              onClose={() => selectSuggestion(null)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default InteractiveDemoEditor;
