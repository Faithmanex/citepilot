"use client";

import React from "react";
import type { AuditResponse, AuditMode } from "@/lib/types";
import type { EditorSuggestionCategory } from "@/lib/editor/types";
import { DocumentEditorCanvas } from "./DocumentEditorCanvas";
import { RigorScoreWidget } from "./RigorScoreWidget";
import { LiveSuggestionFeed } from "./LiveSuggestionFeed";
import { DocumentExportSuite } from "./DocumentExportSuite";
import { useRealtimeDocumentEditor } from "@/lib/editor/useRealtimeDocumentEditor";
import { RotateCcw, Edit3, Eye } from "lucide-react";

export interface ManuscriptEditorWorkspaceProps {
  initialText: string;
  initialHtml?: string;
  auditData: AuditResponse | null;
  documentName?: string;
  mode?: AuditMode;
  onTextChange?: (newText: string) => void;
  onRequestReAudit?: (newText: string) => void;
  className?: string;
}

export const ManuscriptEditorWorkspace: React.FC<ManuscriptEditorWorkspaceProps> = ({
  initialText,
  initialHtml,
  auditData,
  documentName = "manuscript.docx",
  mode = "full",
  onTextChange,
  onRequestReAudit,
  className = "",
}) => {
  const {
    manuscriptText,
    suggestions,
    filteredSuggestions,
    selectedSuggestion,
    selectedSuggestionId,
    hoveredSuggestionId,
    activeCategory,
    isCustomTyping,
    isDirty,
    rigorMetrics,
    textSegments,
    academicSections,
    setActiveCategory,
    setSelectedSuggestionId,
    setHoveredSuggestionId,
    setIsCustomTyping,
    acceptSuggestion,
    dismissSuggestion,
    updateText,
    resetDraft,
    acceptAllInCategory,
  } = useRealtimeDocumentEditor({
    initialText,
    initialAudit: auditData,
    onTextChange,
    onRequestReAudit,
  });

  // Active suggestions for tab counting
  const activeSuggestions = suggestions.filter((s) => s.status === "active");
  const categoryCounts = {
    all: activeSuggestions.length,
    citation: activeSuggestions.filter((s) => s.category === "citation").length,
    claim: activeSuggestions.filter((s) => s.category === "claim").length,
    style: activeSuggestions.filter((s) => s.category === "style").length,
    reference: activeSuggestions.filter((s) => s.category === "reference").length,
  };

  const tabs: { id: EditorSuggestionCategory; label: string; icon: string; count: number }[] = [
    { id: "all", label: "All Issues", icon: "📑", count: categoryCounts.all },
    { id: "citation", label: "Citations", icon: "🔍", count: categoryCounts.citation },
    { id: "claim", label: "Claims", icon: "⚠️", count: categoryCounts.claim },
    { id: "style", label: "Style Rules", icon: "✍️", count: categoryCounts.style },
    { id: "reference", label: "References", icon: "📚", count: categoryCounts.reference },
  ];

  return (
    <section
      data-testid="manuscript-editor-workspace"
      aria-label="CitePilot Production Manuscript Editor"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        {/* Top Segmented Category Filter & Action Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg shadow-none"
          role="tablist"
          aria-label="Manuscript Inspection Categories"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveCategory(tab.id)}
                  className={[
                    "h-9 px-3.5 text-xs font-bold rounded-lg border shadow-none transition-all flex items-center gap-1.5 cursor-pointer select-none",
                    isActive
                      ? "bg-[#ffffff] text-[#221d16] border-[#d9cfb8]"
                      : "bg-transparent text-[#5c5344] border-transparent hover:text-[#221d16] hover:bg-[#d9cfb8]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="text-sm" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-[#e7e9f5] text-[#2c3e8c]" : "bg-[#d9cfb8] text-[#948a76]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              data-testid="workspace-toggle-edit-mode-btn"
              onClick={() => setIsCustomTyping(!isCustomTyping)}
              className={[
                "h-9 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                isCustomTyping
                  ? "bg-[#ffffff] text-[#2c3e8c] border-[#2c3e8c]"
                  : "text-[#5c5344] hover:text-[#221d16] border-[#d9cfb8] bg-[#ffffff] hover:bg-[#d9cfb8]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isCustomTyping ? (
                <>
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>View Highlights</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Direct Prose Editor</span>
                </>
              )}
            </button>
          </div>

          {/* Reset to pristine button */}
          <button
            type="button"
            onClick={resetDraft}
            disabled={!isDirty}
            aria-label="Reset manuscript to original state"
            className={[
              "h-9 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors cursor-pointer select-none",
              isDirty
                ? "text-[#5c5344] hover:text-[#221d16] border-[#d9cfb8] bg-[#ffffff] hover:bg-[#d9cfb8]"
                : "text-[#d9cfb8] border-transparent bg-transparent cursor-not-allowed opacity-50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Draft</span>
          </button>
        </div>

        {/* Responsive Desktop 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Canvas Pane (60% / col-span-7) */}
          <div className="lg:col-span-7 w-full">
            <DocumentEditorCanvas
              currentText={manuscriptText}
              initialHtml={initialHtml}
              textSegments={textSegments}
              sections={academicSections}
              isCustomTyping={isCustomTyping}
              onUpdateText={updateText}
              onToggleCustomTyping={setIsCustomTyping}
              onSelectSuggestion={setSelectedSuggestionId}
              onHoverSuggestion={setHoveredSuggestionId}
            />
          </div>

          {/* Right Inspection & Rigor Score Pane (40% / col-span-5) */}
          <div className="lg:col-span-5 w-full flex flex-col gap-5">
            {/* Rigor Score Counter & Sub-Metrics */}
            <RigorScoreWidget metrics={rigorMetrics} />

            {/* Live Suggestion Feed & Active Card */}
            <LiveSuggestionFeed
              suggestions={suggestions}
              filteredSuggestions={filteredSuggestions}
              selectedSuggestion={selectedSuggestion}
              activeCategory={activeCategory}
              onSelectSuggestion={setSelectedSuggestionId}
              onAcceptSuggestion={acceptSuggestion}
              onDismissSuggestion={dismissSuggestion}
              onCategoryChange={setActiveCategory}
              onAcceptAllStyle={() => acceptAllInCategory("style")}
            />
          </div>
        </div>

        {/* Academic Export Suite */}
        <div className="pt-2">
          <DocumentExportSuite
            data={auditData}
            manuscriptText={manuscriptText}
            documentName={documentName}
          />
        </div>
      </div>
    </section>
  );
};

export default ManuscriptEditorWorkspace;
