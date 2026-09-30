"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { DRAFT_LIST } from "./sampleDrafts";
import type { AcademicDraft } from "./types";

export interface DemoDraftSelectorProps {
  activeDraftId: AcademicDraft["id"];
  onSelectDraft: (draftId: AcademicDraft["id"]) => void;
  onReset: () => void;
  isDirty?: boolean;
  className?: string;
}

export function DemoDraftSelector({
  activeDraftId,
  onSelectDraft,
  onReset,
  isDirty = false,
  className = "",
}: DemoDraftSelectorProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 p-2 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg shadow-none ${className}`.trim()}
      role="tablist"
      aria-label="Academic Manuscript Sample Drafts"
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {DRAFT_LIST.map((draft) => {
          const isActive = draft.id === activeDraftId;
          return (
            <button
              key={draft.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="demo-editor-canvas"
              id={`tab-${draft.id}`}
              onClick={() => onSelectDraft(draft.id)}
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
                {draft.fieldIcon}
              </span>
              <span>{draft.name}</span>
            </button>
          );
        })}
      </div>

      {/* Reset to pristine button */}
      <button
        type="button"
        onClick={onReset}
        disabled={!isDirty}
        aria-label="Reset draft to original manuscript state"
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
        <span>Reset</span>
      </button>
    </div>
  );
}

export default DemoDraftSelector;
