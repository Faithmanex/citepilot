"use client";

import React from "react";
import type { AuditResponse, AuditMode } from "@/lib/types";
import { DocumentEditorCanvas } from "./DocumentEditorCanvas";
import { FindingsSummaryWidget } from "./RigorScoreWidget";
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
  onTextChange,
  onRequestReAudit,
  className = "",
}) => {
  const {
    manuscriptText,
    suggestions,
    filteredSuggestions,
    selectedSuggestion,
    isCustomTyping,
    isDirty,
    findings,
    textSegments,
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

  return (
    <section
      data-testid="manuscript-editor-workspace"
      aria-label="Manuscript editor"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="workspace-toggle-edit-mode-btn"
            onClick={() => setIsCustomTyping(!isCustomTyping)}
            className={[
              "h-9 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors cursor-pointer select-none",
              isCustomTyping
                ? "bg-[#ffffff] text-[#2c3e8c] border-[#2c3e8c]"
                : "text-[#5c5344] hover:text-[#221d16] border-[#d9cfb8] bg-[#ffffff] hover:bg-[#d9cfb8]",
            ].join(" ")}
          >
            {isCustomTyping ? (
              <>
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Review findings</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit document</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetDraft}
            disabled={!isDirty}
            aria-label="Reset manuscript to the last audited text"
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

        {/* Document + findings split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <div className="lg:col-span-7 w-full">
            <DocumentEditorCanvas
              currentText={manuscriptText}
              initialHtml={initialHtml}
              textSegments={textSegments}
              isCustomTyping={isCustomTyping}
              onUpdateText={updateText}
              onSelectSuggestion={setSelectedSuggestionId}
              onHoverSuggestion={setHoveredSuggestionId}
            />
          </div>

          <div className="lg:col-span-5 w-full flex flex-col gap-5">
            <FindingsSummaryWidget summary={findings} />

            <LiveSuggestionFeed
              suggestions={suggestions}
              filteredSuggestions={filteredSuggestions}
              selectedSuggestion={selectedSuggestion}
              onSelectSuggestion={setSelectedSuggestionId}
              onAcceptSuggestion={acceptSuggestion}
              onDismissSuggestion={dismissSuggestion}
              onAcceptAllStyle={() => acceptAllInCategory("style")}
            />
          </div>
        </div>

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
