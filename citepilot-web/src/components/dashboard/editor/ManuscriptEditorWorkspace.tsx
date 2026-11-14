"use client";

import React, { useState } from "react";
import type { AuditResponse, AuditMode } from "@/lib/types";
import type { AuditSummary } from "@/lib/auditState";
import { DocumentEditorCanvas } from "./DocumentEditorCanvas";
import { FindingsSummaryWidget } from "./RigorScoreWidget";
import { LiveSuggestionFeed } from "./LiveSuggestionFeed";
import { DocumentExportSuite } from "./DocumentExportSuite";
import { useRealtimeDocumentEditor } from "@/lib/editor/useRealtimeDocumentEditor";
import { RotateCcw, Edit3, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";

export interface ManuscriptEditorWorkspaceProps {
  initialText: string;
  initialHtml?: string;
  auditData: AuditResponse | null;
  audit: AuditSummary;
  /** True when the current text differs from the audited revision. */
  isStale?: boolean;
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
  audit,
  isStale = false,
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

  const [confirmReset, setConfirmReset] = useState(false);

  const performReset = () => {
    resetDraft();
    setConfirmReset(false);
  };

  return (
    <section
      data-testid="manuscript-editor-workspace"
      aria-labelledby="manuscript-editor-heading"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        <h2 id="manuscript-editor-heading" className="sr-only">
          Manuscript review
        </h2>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="workspace-toggle-edit-mode-btn"
              onClick={() => setIsCustomTyping(!isCustomTyping)}
              aria-pressed={isCustomTyping}
              className={[
                "h-11 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                isCustomTyping
                  ? "bg-[#ffffff] text-[#2c3e8c] border-[#2c3e8c]"
                  : "text-[#5c5344] hover:text-[#221d16] border-[#8f836c] bg-[#ffffff] hover:bg-[#d9cfb8]",
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
              onClick={() => setConfirmReset(true)}
              disabled={!isDirty}
              aria-label="Reset manuscript to the last audited text"
              className={[
                "h-11 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors select-none",
                isDirty
                  ? "text-[#5c5344] hover:text-[#221d16] border-[#8f836c] bg-[#ffffff] hover:bg-[#d9cfb8] cursor-pointer"
                  : "text-[#6b6152] border-[#d9cfb8] bg-transparent cursor-not-allowed opacity-60",
              ].join(" ")}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          {isStale && (
            <p className="text-[11px] font-semibold text-[#7a530c] bg-[#f1e4c8] border border-[#ecd9a8] rounded-lg px-2.5 py-1.5">
              Edited since the last audit — re-run it to refresh findings.
            </p>
          )}
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
            <FindingsSummaryWidget summary={findings} audit={audit} />

            <LiveSuggestionFeed
              suggestions={suggestions}
              filteredSuggestions={filteredSuggestions}
              selectedSuggestion={selectedSuggestion}
              audit={audit}
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
            audit={audit}
            manuscriptText={manuscriptText}
            documentName={documentName}
          />
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset manuscript?"
        description="This restores the last audited text and discards edits and accepted fixes made since then."
        initialFocusId="confirm-reset-button"
        dismissOnBackdrop={false}
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="min-h-11 px-4 rounded-lg border border-[#8f836c] text-xs font-bold text-[#221d16] bg-white hover:bg-[#faf6ec] cursor-pointer"
          >
            Keep my edits
          </button>
          <button
            id="confirm-reset-button"
            type="button"
            onClick={performReset}
            className="min-h-11 px-4 rounded-lg bg-[#a32b21] hover:bg-[#7d1f18] text-white text-xs font-bold cursor-pointer"
          >
            Reset and discard edits
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default ManuscriptEditorWorkspace;
