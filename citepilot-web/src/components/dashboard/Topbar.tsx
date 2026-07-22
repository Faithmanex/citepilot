"use client";

import type { CitationStyle, AuditMode } from "@/lib/types";

interface TopbarProps {
  mode: AuditMode;
  onModeChange: (mode: AuditMode) => void;
  style: CitationStyle;
  onStyleChange: (style: CitationStyle) => void;
  onRunAudit: () => void;
  onToggleInput: () => void;
  inputCollapsed: boolean;
  hasDocument: boolean;
  documentName: string;
  onClearDocument: () => void;
  progress: { visible: boolean; message: string; pct: number };
  onToggleMobileSidebar?: () => void;
}

const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: "APA 7th Edition",
  apa6: "APA 6th Edition",
  mla9: "MLA 9th Edition",
  chicago17: "Chicago 17th (Author-Date)",
  harvard: "Harvard (Standard)",
  ieee: "IEEE",
  vancouver: "Vancouver",
  turabian: "Turabian",
  oscola: "OSCOLA (Oxford Standard)",
};

export default function Topbar({
  mode,
  onModeChange,
  style,
  onStyleChange,
  onRunAudit,
  onToggleInput,
  inputCollapsed,
  hasDocument,
  documentName,
  onClearDocument,
  progress,
  onToggleMobileSidebar,
}: TopbarProps) {
  return (
    <div className="sticky top-0 z-20 bg-dash-paper/95 backdrop-blur-md border-b-2 border-line px-4 sm:px-7 py-3.5">
      <div className="flex items-center gap-2 sm:gap-[18px] flex-wrap">
        {onToggleMobileSidebar && (
          <button
            type="button"
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] px-3 bg-card border-2 border-line rounded-md text-dash-ink font-bold"
            onClick={onToggleMobileSidebar}
            aria-label="Open Audit Navigation Menu"
          >
            <i className="fas fa-bars text-base" />
          </button>
        )}

        <div
          className="flex items-center gap-2 text-[13.5px] font-bold text-dash-ink min-h-[44px] bg-card border-2 border-line px-3.5 py-2 rounded-md cursor-pointer max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          id="doc-chip"
          role="button"
          tabIndex={0}
          aria-label={
            hasDocument
              ? `Loaded document: ${documentName}`
              : "No document loaded"
          }
        >
          <span
            className="w-2 h-2 rounded-full flex-none"
            style={{
              background: hasDocument
                ? "var(--color-verified)"
                : "var(--color-line)",
            }}
            aria-hidden="true"
          />
          <span id="doc-file-name" className="truncate">{documentName}</span>
          {hasDocument && (
            <button
              id="btn-reset-doc"
              style={{
                background: "none",
                border: "none",
                color: "var(--color-dash-ink-faint)",
                cursor: "pointer",
                padding: "0 4px",
                fontSize: "12px",
                marginLeft: "4px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClearDocument();
              }}
              aria-label="Clear loaded document"
            >
              &times;
            </button>
          )}
        </div>

        <div className="seg-control max-w-full overflow-x-auto" id="audit-mode" role="radiogroup" aria-label="Audit Mode Selector">
          <button
            className={mode === "full" ? "active" : ""}
            data-mode="full"
            onClick={() => onModeChange("full")}
            aria-checked={mode === "full"}
            role="radio"
            tabIndex={mode === "full" ? 0 : -1}
          >
            Full Manuscript
          </button>
          <button
            className={mode === "reference_only" ? "active" : ""}
            data-mode="reference_only"
            onClick={() => onModeChange("reference_only")}
            aria-checked={mode === "reference_only"}
            role="radio"
            tabIndex={mode === "reference_only" ? 0 : -1}
          >
            Ref-List-Only
          </button>
        </div>

        <select
          className="font-dash text-[13px] font-bold min-h-[44px] px-3.5 py-[9px] rounded-md border-2 border-line bg-card text-dash-ink max-w-full"
          id="style-select"
          value={style}
          onChange={(e) => onStyleChange(e.target.value as CitationStyle)}
          aria-label="Select Citation Style Manual"
        >
          {Object.entries(STYLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          className="link-btn sm:ml-auto"
          id="btn-toggle-input-bar"
          onClick={onToggleInput}
          aria-expanded={!inputCollapsed}
          aria-controls="input-section"
          aria-label="Toggle Document Input Area"
        >
          <i className={`fas ${inputCollapsed ? "fa-edit" : "fa-chevron-up"}`} />{" "}
          {inputCollapsed ? "Modify Input" : "Hide Input"}
        </button>

        <button
          className="btn-dash"
          id="run-btn"
          onClick={onRunAudit}
          aria-label="Run Audit Analysis"
        >
          <i className="fas fa-play text-[10px]" aria-hidden="true" /> Run audit
        </button>
      </div>

      {progress.visible && (
        <div
          className="mt-3.5"
          id="progress-wrap"
          role="progressbar"
          aria-valuenow={progress.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-live="polite"
        >
          <div className="h-1.5 bg-line rounded overflow-hidden">
            <div
              className="h-full bg-brand rounded transition-all duration-350 ease"
              id="progress-fill"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-xs font-bold text-dash-ink-soft">
            <span id="progress-phase">{progress.message}</span>
            <span id="progress-pct">{progress.pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

