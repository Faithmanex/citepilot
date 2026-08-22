"use client";

import type { CitationStyle, AuditMode } from "@/lib/types";
import {
  Menu,
  FileText,
  X,
  Play,
  Loader2,
} from "lucide-react";

import UserMenu from "../auth/UserMenu";

interface TopbarProps {
  mode: AuditMode;
  onModeChange: (mode: AuditMode) => void;
  style: CitationStyle;
  onStyleChange: (style: CitationStyle) => void;
  onRunAudit: () => void;
  hasDocument: boolean;
  documentName: string;
  onClearDocument: () => void;
  progress: { visible: boolean; message: string; pct: number };
  onToggleMobileSidebar?: () => void;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: "APA 7th",
  apa6: "APA 6th",
  mla9: "MLA 9th",
  chicago17: "Chicago 17",
  harvard: "Harvard",
  ieee: "IEEE",
  vancouver: "Vancouver",
  turabian: "Turabian",
  oscola: "OSCOLA",
};

export default function Topbar({
  mode,
  onModeChange,
  style,
  onStyleChange,
  onRunAudit,
  hasDocument,
  documentName,
  onClearDocument,
  progress,
  onToggleMobileSidebar,
  onOpenAuth,
  onOpenSubscription,
}: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-30 bg-[#FAF6EC] border-b border-[#C7BC9F] px-4 sm:px-6 py-3"
      role="banner"
    >
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {/* Left: Mobile menu + document pill */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 bg-[#F1EBDC] border border-[#C7BC9F] rounded-lg text-[#353027] hover:text-[#221D16] transition-colors"
              onClick={onToggleMobileSidebar}
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Document pill */}
          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              hasDocument
                ? "bg-[#DEE8DD] border-[#1E5E4B]/40 text-[#1E5E4B]"
                : "bg-[#F1EBDC] border-[#C7BC9F] text-[#696050]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-none" />
            <span className="truncate max-w-[180px] font-mono text-[11px]">
              {documentName}
            </span>
            {hasDocument && (
              <button
                className="ml-0.5 text-[#696050] hover:text-[#961E14] p-0.5 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearDocument();
                }}
                aria-label="Clear document"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Audit Mode toggle */}
          <div className="bg-[#F1EBDC] border border-[#C7BC9F] rounded-lg p-1 flex items-center gap-1">
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "full"
                  ? "bg-[#221D16] text-[#F1EBDC]"
                  : "text-[#696050] hover:text-[#221D16]"
              }`}
              onClick={() => onModeChange("full")}
            >
              Full Manuscript
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "reference_only"
                  ? "bg-[#221D16] text-[#F1EBDC]"
                  : "text-[#696050] hover:text-[#221D16]"
              }`}
              onClick={() => onModeChange("reference_only")}
            >
              Reference List Only
            </button>
          </div>

          {/* Citation Style */}
          <select
            className="bg-[#F1EBDC] border border-[#C7BC9F] text-[#221D16] text-xs font-bold h-9 px-3 rounded-lg outline-none focus:border-[#1E5E4B] transition-colors cursor-pointer"
            value={style}
            onChange={(e) => onStyleChange(e.target.value as CitationStyle)}
            aria-label="Citation style"
          >
            {Object.entries(STYLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>


          <button
            className="flex items-center gap-2 h-9 px-4 bg-[#1E5E4B] hover:bg-[#285235] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
            onClick={onRunAudit}
            disabled={progress.visible}
            aria-label="Run citation audit"
          >
            {progress.visible ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{progress.visible ? "Auditing…" : "Run Audit"}</span>
          </button>

          <div className="pl-1 border-l border-[#C7BC9F]/60">
            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenSubscription={onOpenSubscription}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress.visible && (
        <div className="mt-2.5 pt-2 border-t border-[#C7BC9F]/60">
          <div className="h-1.5 bg-[#E8E0CE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E5E4B] transition-all duration-500 rounded-full"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#696050] font-mono mt-1">
            {progress.message} — {progress.pct}%
          </p>
        </div>
      )}
    </header>
  );
}
