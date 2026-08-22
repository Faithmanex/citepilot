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
      className={`flex flex-wrap items-center justify-between gap-2.5 p-2 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg shadow-none ${className}`.trim()}
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
                  ? "bg-[#ffffff] text-[#0e101a] border-[#d9d9d9]"
                  : "bg-transparent text-[#545454] border-transparent hover:text-[#0e101a] hover:bg-[#ebebeb]",
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
            ? "text-[#545454] hover:text-[#0e101a] border-[#d9d9d9] bg-[#ffffff] hover:bg-[#ebebeb]"
            : "text-[#b7b7b7] border-transparent bg-transparent cursor-not-allowed opacity-50",
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
