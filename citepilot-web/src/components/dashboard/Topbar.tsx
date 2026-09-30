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
      className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#d9cfb8] px-4 sm:px-6 py-3 shadow-none"
      role="banner"
    >
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {/* Left: Mobile menu + document pill */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg text-[#5c5344] hover:text-[#221d16] hover:bg-[#d9cfb8] transition-colors"
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
                ? "bg-[#e7e9f5] border-[#c9cee8] text-[#2c3e8c]"
                : "bg-[#faf6ec] border-[#d9cfb8] text-[#5c5344]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-none" />
            <span className="truncate max-w-[180px] font-mono text-[11px]">
              {documentName}
            </span>
            {hasDocument && (
              <button
                className="ml-0.5 text-[#948a76] hover:text-[#a32b21] p-0.5 rounded transition-colors"
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
          <div className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-1 flex items-center gap-1">
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "full"
                  ? "bg-[#ffffff] text-[#221d16] border border-[#d9cfb8] shadow-none"
                  : "text-[#5c5344] hover:text-[#221d16]"
              }`}
              onClick={() => onModeChange("full")}
            >
              Whole document
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                mode === "reference_only"
                  ? "bg-[#ffffff] text-[#221d16] border border-[#d9cfb8] shadow-none"
                  : "text-[#5c5344] hover:text-[#221d16]"
              }`}
              onClick={() => onModeChange("reference_only")}
            >
              References only
            </button>
          </div>

          {/* Citation Style */}
          <select
            className="bg-[#ffffff] border border-[#d9cfb8] text-[#221d16] text-xs font-bold h-9 px-3 rounded-lg outline-none focus:border-[#2c3e8c] transition-colors cursor-pointer"
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
            data-testid="run-audit-btn"
            className="flex items-center gap-2 h-9 px-4 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-bold text-xs rounded-lg shadow-none transition-all cursor-pointer disabled:opacity-60"
            onClick={onRunAudit}
            disabled={progress.visible}
            aria-label="Run citation audit"
          >
            {progress.visible ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{progress.visible ? "Checking…" : "Check citations"}</span>
          </button>

          <div className="pl-1 border-l border-[#d9cfb8]">
            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenSubscription={onOpenSubscription}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress.visible && (
        <div className="mt-2.5 pt-2 border-t border-[#d9cfb8]">
          <div className="h-1.5 bg-[#d9cfb8] rounded-lg overflow-hidden">
            <div
              className="h-full bg-[#2c3e8c] transition-all duration-500 rounded-lg"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#948a76] font-mono mt-1">
            {progress.message} — {progress.pct}%
          </p>
        </div>
      )}
    </header>
  );
}
