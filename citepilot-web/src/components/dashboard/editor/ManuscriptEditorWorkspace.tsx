"use client";

import React, { useEffect } from "react";
import type { AuditResponse } from "@/lib/types";
import { useRealtimeDocumentEditor } from "@/lib/editor/useRealtimeDocumentEditor";
import { DocumentEditorCanvas } from "./DocumentEditorCanvas";
import { RigorScoreWidget } from "./RigorScoreWidget";
import { LiveSuggestionFeed } from "./LiveSuggestionFeed";
import { DocumentExportSuite } from "./DocumentExportSuite";

export interface ManuscriptEditorWorkspaceProps {
  initialText: string;
  auditData: AuditResponse | null;
  documentName?: string;
  onTextChange?: (newText: string) => void;
  onRequestReAudit?: (newText: string) => void;
  className?: string;
}

export const ManuscriptEditorWorkspace: React.FC<ManuscriptEditorWorkspaceProps> = ({
  initialText,
  auditData,
  documentName = "manuscript.docx",
  onTextChange,
  onRequestReAudit,
  className = "",
}) => {
  const {
    manuscriptText,
    filteredSuggestions,
    suggestions,
    selectedSuggestion,
    activeCategory,
    isCustomTyping,
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
    acceptAllInCategory,
  } = useRealtimeDocumentEditor({
    initialText,
    initialAudit: auditData,
    onTextChange,
    onRequestReAudit,
  });

  return (
    <div
      data-testid="manuscript-editor-workspace"
      className={`w-full space-y-6 animate-fade-in ${className}`.trim()}
    >
      {/* 60 / 40 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Canvas: 60% / col-span-7) */}
        <div className="lg:col-span-7 w-full flex flex-col gap-4">
          <DocumentEditorCanvas
            currentText={manuscriptText}
            textSegments={textSegments}
            sections={academicSections}
            isCustomTyping={isCustomTyping}
            onUpdateText={updateText}
            onToggleCustomTyping={setIsCustomTyping}
            onSelectSuggestion={setSelectedSuggestionId}
            onHoverSuggestion={setHoveredSuggestionId}
          />
        </div>

        {/* Right Column (Rigor Score & Live Suggestions: 40% / col-span-5) */}
        <div className="lg:col-span-5 w-full flex flex-col gap-4">
          {/* Rigor Score Counter */}
          <RigorScoreWidget metrics={rigorMetrics} />

          {/* Live Suggestions Stream */}
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

      {/* Full Academic Export Suite */}
      <DocumentExportSuite
        data={auditData}
        manuscriptText={manuscriptText}
        documentName={documentName}
      />
    </div>
  );
};

export default ManuscriptEditorWorkspace;
