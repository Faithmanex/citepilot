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
  onOpenReplaceModal?: () => void;
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
  onOpenReplaceModal,
}: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#ebebeb] px-4 sm:px-6 py-3 shadow-none"
      role="banner"
    >
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {/* Left: Mobile menu + document pill */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-[#545454] hover:text-[#0e101a] hover:bg-[#ebebeb] transition-colors"
              onClick={onToggleMobileSidebar}
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Document pill */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenReplaceModal}
              title={hasDocument ? "Click to replace or edit document" : "Click to select document"}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                hasDocument
                  ? "bg-[#e6f4f2] border-[#a7dcd4] text-[#027e6f] hover:bg-[#d8efe9]"
                  : "bg-[#f5f5f5] border-[#d9d9d9] text-[#545454] hover:bg-[#ebebeb]"
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-none" />
              <span className="truncate max-w-[180px] font-mono text-[11px]">
                {documentName}
              </span>
            </button>
            {hasDocument && (
              <button
                type="button"
                className="text-[#707070] hover:text-[#b91c1c] p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                onClick={onClearDocument}
                aria-label="Clear document"
                title="Clear document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Audit Mode toggle */}
          <div className="bg-[#f5f5f5] border border-[#ebebeb] rounded-lg p-1 flex items-center gap-1">
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "full"
                  ? "bg-[#ffffff] text-[#0e101a] border border-[#d9d9d9] shadow-none"
                  : "text-[#545454] hover:text-[#0e101a]"
              }`}
              onClick={() => onModeChange("full")}
            >
              Full Manuscript
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "reference_only"
                  ? "bg-[#ffffff] text-[#0e101a] border border-[#d9d9d9] shadow-none"
                  : "text-[#545454] hover:text-[#0e101a]"
              }`}
              onClick={() => onModeChange("reference_only")}
            >
              Reference List Only
            </button>
          </div>

          {/* Citation Style */}
          <select
            className="bg-[#ffffff] border border-[#d9d9d9] text-[#0e101a] text-xs font-bold h-9 px-3 rounded-lg outline-none focus:border-[#027e6f] transition-colors cursor-pointer"
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
            className="flex items-center gap-2 h-9 px-4 bg-[#027e6f] hover:bg-[#02665a] text-white font-bold text-xs rounded-lg shadow-none transition-all cursor-pointer disabled:opacity-60"
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

          <div className="pl-1 border-l border-[#ebebeb]">
            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenSubscription={onOpenSubscription}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress.visible && (
        <div className="mt-2.5 pt-2 border-t border-[#ebebeb]">
          <div className="h-1.5 bg-[#ebebeb] rounded-lg overflow-hidden">
            <div
              className="h-full bg-[#027e6f] transition-all duration-500 rounded-lg"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#707070] font-mono mt-1">
            {progress.message} — {progress.pct}%
          </p>
        </div>
      )}
    </header>
  );
}
