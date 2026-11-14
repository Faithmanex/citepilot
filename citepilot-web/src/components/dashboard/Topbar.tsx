"use client";

import { useEffect, useState } from "react";
import type { CitationStyle, AuditMode } from "@/lib/types";
import { STYLE_LABELS } from "@/lib/types";
import { Menu, FileText, X, Play, Loader2, SlidersHorizontal } from "lucide-react";

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
  progress: {
    visible: boolean;
    message: string;
    startedAt: number;
    stages: Array<{ label: string; state: "done" | "active" | "pending" }>;
  };
  onToggleMobileSidebar?: () => void;
  mobileNavOpen?: boolean;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: AuditMode;
  onModeChange: (mode: AuditMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Audit scope"
      className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-1 flex items-center gap-1"
    >
      <button
        type="button"
        aria-pressed={mode === "full"}
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
        type="button"
        aria-pressed={mode === "reference_only"}
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
  );
}

function StyleSelect({
  style,
  onStyleChange,
}: {
  style: CitationStyle;
  onStyleChange: (style: CitationStyle) => void;
}) {
  return (
    <select
      className="bg-[#ffffff] border border-[#8f836c] text-[#221d16] text-xs font-bold h-9 px-3 rounded-lg outline-none focus:border-[#2c3e8c] transition-colors cursor-pointer"
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
  );
}

function useElapsedSeconds(active: boolean, startedAt: number): number {
  // One clock tick per second. The elapsed value is stored with the run it
  // belongs to, so a new run starts at 0 instead of inheriting the old count.
  const [clock, setClock] = useState<{ startedAt: number; elapsed: number }>({
    startedAt: 0,
    elapsed: 0,
  });
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setClock({
        startedAt,
        elapsed: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  if (!active) return 0;
  return clock.startedAt === startedAt ? clock.elapsed : 0;
}

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
  mobileNavOpen = false,
  onOpenAuth,
  onOpenSubscription,
}: TopbarProps) {
  const elapsed = useElapsedSeconds(progress.visible, progress.startedAt);

  return (
    <header
      className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#d9cfb8] px-4 sm:px-6 py-2.5 sm:py-3 shadow-none"
      role="banner"
    >
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {/* Left: mobile menu + document identity */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-10 h-10 bg-[#faf6ec] border border-[#8f836c] rounded-lg text-[#5c5344] hover:text-[#221d16] hover:bg-[#d9cfb8] transition-colors"
              onClick={onToggleMobileSidebar}
              aria-label="Navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="primary-navigation"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              hasDocument
                ? "bg-[#e7e9f5] border-[#c9cee8] text-[#2c3e8c]"
                : "bg-[#faf6ec] border-[#d9cfb8] text-[#5c5344]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
            <span className="truncate max-w-[150px] sm:max-w-[220px] font-mono text-[11px]">
              {documentName}
            </span>
            {hasDocument && (
              <button
                type="button"
                className="ml-0.5 text-[#6b6152] hover:text-[#a32b21] p-1 -m-1 rounded transition-colors"
                onClick={onClearDocument}
                aria-label={`Clear document ${documentName}`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Right: primary action + settings */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            data-testid="run-audit-btn"
            className="flex items-center gap-2 h-10 px-4 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-bold text-xs rounded-lg shadow-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onRunAudit}
            disabled={progress.visible || !hasDocument}
            aria-label="Run citation audit"
            aria-describedby={!hasDocument ? "audit-needs-document" : undefined}
          >
            {progress.visible ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
            )}
            <span>{progress.visible ? "Auditing…" : "Check citations"}</span>
          </button>

          {/* Settings: inline on desktop, grouped behind a disclosure on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle mode={mode} onModeChange={onModeChange} />
            <StyleSelect style={style} onStyleChange={onStyleChange} />
          </div>

          <details className="md:hidden relative">
            <summary
              className="list-none flex items-center gap-1.5 h-10 px-3 border border-[#8f836c] rounded-lg text-xs font-bold text-[#5c5344] cursor-pointer select-none"
              aria-label={`Audit settings: ${STYLE_LABELS[style]}, ${
                mode === "full" ? "whole document" : "references only"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">Audit settings.</span>
              <span aria-hidden="true">{STYLE_LABELS[style]}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-64 bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-3 space-y-3 z-40">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5c5344] mb-1.5">
                  Citation style
                </p>
                <StyleSelect style={style} onStyleChange={onStyleChange} />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5c5344] mb-1.5">
                  Audit scope
                </p>
                <ModeToggle mode={mode} onModeChange={onModeChange} />
              </div>
              <p className="text-[11px] text-[#6b6152]">
                Active: {STYLE_LABELS[style]} ·{" "}
                {mode === "full" ? "Whole document" : "References only"}
              </p>
            </div>
          </details>

          <div className="pl-1 border-l border-[#d9cfb8]">
            <UserMenu onOpenAuth={onOpenAuth} onOpenSubscription={onOpenSubscription} />
          </div>
        </div>
      </div>

      {!hasDocument && (
        <p id="audit-needs-document" className="sr-only">
          Add a document before running an audit.
        </p>
      )}

      {/* Honest, indeterminate progress: no invented percentages. */}
      {progress.visible && (
        <div className="mt-2.5 pt-2 border-t border-[#d9cfb8]">
          <div
            className="h-1.5 bg-[#d9cfb8] rounded-lg overflow-hidden"
            role="progressbar"
            aria-label="Audit progress"
            aria-valuetext={`Audit in progress for ${elapsed} seconds`}
          >
            <div className="h-full w-full bg-[#2c3e8c] rounded-lg audit-progress-bar" />
          </div>
          <div
            className="text-[11px] text-[#5c5344] font-mono mt-1 flex flex-wrap items-center gap-x-2"
            role="status"
            aria-live="polite"
          >
            <span>{progress.message}</span>
            <span aria-hidden="true">·</span>
            <span>{elapsed}s elapsed</span>
            <span className="sr-only">
              Current step: {progress.stages.find((s) => s.state === "active")?.label || ""}
            </span>
            <span className="text-[#6b6152] hidden sm:inline">
              Usually under 45 seconds for short manuscripts.
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
