"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { AuditResponse } from "@/lib/types";
import type {
  DemoSuggestion,
  RigorMetrics,
  TextSegment,
  SuggestionCategory,
} from "@/components/landing/demo/types";
import { DemoEditorSurface } from "@/components/landing/demo/DemoEditorSurface";
import { DemoScoreCounter } from "@/components/landing/demo/DemoScoreCounter";
import { DemoSuggestionCard } from "@/components/landing/demo/DemoSuggestionCard";
import {
  applySuggestionReplacement,
  splitTextIntoSegments,
} from "@/components/landing/demo/spanMutation";
import { calculateRigorScore } from "@/components/landing/demo/rigorScoring";
import { adaptAuditResponseToDemoSuggestions } from "@/lib/editor/suggestionAdapter";
import { DocumentExportSuite } from "./DocumentExportSuite";
import CrossrefPanel from "../CrossrefPanel";
import OverviewPanel from "../OverviewPanel";
import RecencyPanel from "../RecencyPanel";
import StructurePanel from "../StructurePanel";
import {
  RotateCcw,
  Edit3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

export interface ManuscriptEditorWorkspaceProps {
  initialText: string;
  auditData: AuditResponse | null;
  documentName?: string;
  mode?: string;
  onTextChange?: (newText: string) => void;
  onRequestReAudit?: (newText: string) => void;
  className?: string;
}

export const ManuscriptEditorWorkspace: React.FC<ManuscriptEditorWorkspaceProps> = ({
  initialText,
  auditData,
  documentName = "manuscript.docx",
  mode = "full",
  onTextChange,
  onRequestReAudit,
  className = "",
}) => {
  const [currentText, setCurrentText] = useState<string>(initialText);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);
  const [isCustomTyping, setIsCustomTyping] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [inspectorTab, setInspectorTab] = useState<"issues" | "integrity" | "analytics">("issues");

  const pristineTextRef = useRef<string>(initialText);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialText if parent document changes
  useEffect(() => {
    setCurrentText(initialText);
    pristineTextRef.current = initialText;
    setAcceptedIds([]);
    setDismissedIds([]);
    setSelectedSuggestionId(null);
  }, [initialText]);

  // Derive canonical suggestions from auditData & currentText
  const allSuggestions = useMemo<DemoSuggestion[]>(() => {
    return adaptAuditResponseToDemoSuggestions(auditData, currentText);
  }, [auditData, currentText]);

  // Compute active suggestions with their latest status (pending / accepted / dismissed)
  const activeSuggestions = useMemo<DemoSuggestion[]>(() => {
    const acceptedSet = new Set(acceptedIds);
    const dismissedSet = new Set(dismissedIds);

    return allSuggestions.map((s) => {
      if (acceptedSet.has(s.id)) return { ...s, status: "accepted" as const };
      if (dismissedSet.has(s.id)) return { ...s, status: "dismissed" as const };
      return { ...s, status: "pending" as const };
    });
  }, [allSuggestions, acceptedIds, dismissedIds]);

  // Filter suggestions by active tab category
  const filteredSuggestions = useMemo<DemoSuggestion[]>(() => {
    if (activeCategoryFilter === "all") return activeSuggestions;
    return activeSuggestions.filter((s) => s.category === activeCategoryFilter);
  }, [activeSuggestions, activeCategoryFilter]);

  // Pending subset
  const pendingSuggestions = useMemo(
    () => filteredSuggestions.filter((s) => s.status === "pending"),
    [filteredSuggestions]
  );

  // Selected suggestion entity
  const selectedSuggestion = useMemo(() => {
    if (!selectedSuggestionId) return null;
    return activeSuggestions.find((s) => s.id === selectedSuggestionId) ?? null;
  }, [activeSuggestions, selectedSuggestionId]);

  // Word count helper
  const wordCount = useMemo(() => {
    return currentText.trim().split(/\s+/).filter(Boolean).length;
  }, [currentText]);

  // Dynamic Rigor Score
  const scoreMetrics = useMemo<RigorMetrics>(() => {
    return calculateRigorScore(
      activeSuggestions,
      acceptedIds,
      dismissedIds,
      72,
      wordCount
    );
  }, [activeSuggestions, acceptedIds, dismissedIds, wordCount]);

  // Text segments for rendering
  const textSegments = useMemo<TextSegment[]>(() => {
    return splitTextIntoSegments(
      currentText,
      activeSuggestions,
      selectedSuggestionId,
      hoveredSuggestionId
    );
  }, [currentText, activeSuggestions, selectedSuggestionId, hoveredSuggestionId]);

  // Is dirty indicator
  const isDirty = useMemo(() => {
    return (
      acceptedIds.length > 0 ||
      dismissedIds.length > 0 ||
      currentText !== pristineTextRef.current
    );
  }, [acceptedIds, dismissedIds, currentText]);

  // Update text directly (typing mode)
  const handleUpdateText = useCallback(
    (newText: string) => {
      setCurrentText(newText);
      onTextChange?.(newText);

      // Debounce re-audit trigger after 2.5s idle
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onRequestReAudit?.(newText);
      }, 2500);
    },
    [onTextChange, onRequestReAudit]
  );

  // Accept Suggestion (Inline mutation & offset recalculation)
  const handleAcceptSuggestion = useCallback(
    (suggestionId: string) => {
      const target = activeSuggestions.find((s) => s.id === suggestionId);
      if (!target) return;

      const { newText } = applySuggestionReplacement(
        currentText,
        target,
        activeSuggestions
      );

      setCurrentText(newText);
      setAcceptedIds((prev) => [...prev, suggestionId]);
      setDismissedIds((prev) => prev.filter((id) => id !== suggestionId));
      onTextChange?.(newText);

      // Auto-advance to next pending suggestion if available
      const remaining = pendingSuggestions.filter((s) => s.id !== suggestionId);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [activeSuggestions, currentText, onTextChange, pendingSuggestions]
  );

  // Dismiss Suggestion
  const handleDismissSuggestion = useCallback(
    (suggestionId: string) => {
      setDismissedIds((prev) => [...prev, suggestionId]);
      setAcceptedIds((prev) => prev.filter((id) => id !== suggestionId));

      const remaining = pendingSuggestions.filter((s) => s.id !== suggestionId);
      setSelectedSuggestionId(remaining.length > 0 ? remaining[0].id : null);
    },
    [pendingSuggestions]
  );

  // Reset to original text
  const handleReset = useCallback(() => {
    setCurrentText(pristineTextRef.current);
    setAcceptedIds([]);
    setDismissedIds([]);
    setSelectedSuggestionId(null);
    onTextChange?.(pristineTextRef.current);
  }, [onTextChange]);

  // Category Tabs Configuration
  const categoryCounts = useMemo(() => {
    const pending = activeSuggestions.filter((s) => s.status === "pending");
    return {
      all: pending.length,
      "missing-citation": pending.filter((s) => s.category === "missing-citation").length,
      "claim-needs-source": pending.filter((s) => s.category === "claim-needs-source").length,
      "outdated-reference": pending.filter((s) => s.category === "outdated-reference").length,
      "tone-clarity": pending.filter((s) => s.category === "tone-clarity").length,
    };
  }, [activeSuggestions]);

  // Calculate integrity count (retractions + Crossref discrepancies)
  const integrityCount = useMemo(() => {
    if (!auditData?.references) return 0;
    const retracted = auditData.references.filter((r) => r.status === "retracted").length;
    const discrepancies = auditData.references.reduce(
      (acc, r) => acc + (r.crossref_validation?.discrepancies?.length ?? 0),
      0
    );
    return retracted + discrepancies;
  }, [auditData]);

  const tabs: { id: string; label: string; icon: string; count: number }[] = [
    { id: "all", label: "All Issues", icon: "📑", count: categoryCounts.all },
    { id: "missing-citation", label: "Citations", icon: "🔍", count: categoryCounts["missing-citation"] },
    { id: "claim-needs-source", label: "Claims", icon: "⚠️", count: categoryCounts["claim-needs-source"] },
    { id: "tone-clarity", label: "Style Rules", icon: "✍️", count: categoryCounts["tone-clarity"] },
    { id: "outdated-reference", label: "References", icon: "📚", count: categoryCounts["outdated-reference"] },
  ];

  return (
    <section
      data-testid="manuscript-editor-workspace"
      aria-label="CitePilot Live Interactive Manuscript Editor"
      className={`w-full max-w-[1200px] mx-auto transition-all ${className}`.trim()}
    >
      <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-lg p-4 sm:p-6 lg:p-8 shadow-none space-y-5 sm:space-y-6">
        {/* Top Control Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg shadow-none"
          role="tablist"
          aria-label="Manuscript Inspection Categories"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const isActive = activeCategoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  id={`tab-${tab.id}`}
                  onClick={() => {
                    setActiveCategoryFilter(tab.id);
                    if (!inspectorOpen) setInspectorOpen(true);
                    if (inspectorTab !== "issues") setInspectorTab("issues");
                  }}
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
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-[#e6f4f2] text-[#027e6f]" : "bg-[#e5e5e5] text-[#707070]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              data-testid="toggle-edit-mode-btn"
              onClick={() => setIsCustomTyping((prev) => !prev)}
              className={[
                "h-9 px-3 text-xs font-bold rounded-lg border shadow-none flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                isCustomTyping
                  ? "bg-[#ffffff] text-[#027e6f] border-[#027e6f]"
                  : "text-[#545454] hover:text-[#0e101a] border-[#d9d9d9] bg-[#ffffff] hover:bg-[#ebebeb]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isCustomTyping ? "View Highlights" : "Direct Prose Editor"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!inspectorOpen && (
              <button
                type="button"
                data-testid="expand-inspector-btn"
                onClick={() => setInspectorOpen(true)}
                className="h-9 px-3 text-xs font-bold rounded-lg border border-[#a7dcd4] bg-[#e6f4f2] text-[#027e6f] hover:bg-[#d8efe9] flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title="Open Inspector Panel"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Inspector ({categoryCounts.all})</span>
              </button>
            )}

            {/* Reset to pristine button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty}
              aria-label="Reset manuscript to original state"
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
              <span>Reset Draft</span>
            </button>
          </div>
        </div>

        {/* Responsive Desktop Split Layout & Collapsible Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Canvas Pane */}
          <div className={inspectorOpen ? "lg:col-span-7 w-full" : "lg:col-span-12 w-full"}>
            <DemoEditorSurface
              currentText={currentText}
              textSegments={textSegments}
              isCustomTyping={isCustomTyping}
              onUpdateText={handleUpdateText}
              onSelectSuggestion={(id) => {
                setSelectedSuggestionId(id);
                if (!inspectorOpen) setInspectorOpen(true);
                if (inspectorTab !== "issues") setInspectorTab("issues");
              }}
              onHoverSuggestion={setHoveredSuggestionId}
            />
          </div>

          {/* Right Inspection & Rigor Score Pane */}
          {inspectorOpen && (
            <div className="lg:col-span-5 w-full flex flex-col gap-4">
              {/* Inspector Header: 3 Tabs + Collapse Button */}
              <div className="flex items-center justify-between p-1.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg shadow-none">
                <div className="flex items-center gap-1" role="tablist" aria-label="Inspector Panels">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "issues"}
                    onClick={() => setInspectorTab("issues")}
                    className={`h-8 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectorTab === "issues"
                        ? "bg-[#ffffff] text-[#0e101a] border border-[#d9d9d9] shadow-none"
                        : "text-[#545454] hover:text-[#0e101a]"
                    }`}
                  >
                    <span>Issues</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      categoryCounts.all > 0 ? "bg-[#b91c1c] text-white" : "bg-[#e5e5e5] text-[#707070]"
                    }`}>
                      {categoryCounts.all}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "integrity"}
                    onClick={() => setInspectorTab("integrity")}
                    className={`h-8 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectorTab === "integrity"
                        ? "bg-[#ffffff] text-[#0e101a] border border-[#d9d9d9] shadow-none"
                        : "text-[#545454] hover:text-[#0e101a]"
                    }`}
                  >
                    <span>Integrity</span>
                    {integrityCount > 0 ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#b45309] text-white">
                        {integrityCount}
                      </span>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#027e6f]" />
                    )}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "analytics"}
                    onClick={() => setInspectorTab("analytics")}
                    className={`h-8 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectorTab === "analytics"
                        ? "bg-[#ffffff] text-[#0e101a] border border-[#d9d9d9] shadow-none"
                        : "text-[#545454] hover:text-[#0e101a]"
                    }`}
                  >
                    <span>Analytics</span>
                    <span className="text-[10px] font-mono font-bold text-[#027e6f]">
                      {scoreMetrics.finalScore}%
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  data-testid="collapse-inspector-btn"
                  className="p-1.5 text-[#707070] hover:text-[#0e101a] rounded hover:bg-[#ebebeb] transition-colors cursor-pointer"
                  title="Collapse Inspector"
                  aria-label="Collapse Inspector"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Tab 1: Issues View */}
              {inspectorTab === "issues" && (
                <div className="space-y-4">
                  {/* Rigor Score Counter & Sub-Metrics */}
                  <DemoScoreCounter metrics={scoreMetrics} />

                  {/* Active Suggestion Diff Card */}
                  <DemoSuggestionCard
                    suggestion={selectedSuggestion}
                    onAccept={handleAcceptSuggestion}
                    onDismiss={handleDismissSuggestion}
                    onClose={() => setSelectedSuggestionId(null)}
                  />

                  {/* Quick issue list if no suggestion card is currently focused */}
                  {!selectedSuggestion && pendingSuggestions.length > 0 && (
                    <div className="bg-white border border-[#ebebeb] rounded-lg p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1f243c]">
                        <span>Pending Issues ({pendingSuggestions.length})</span>
                        <span className="text-[11px] text-[#707070]">Click to view diff</span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {pendingSuggestions.slice(0, 10).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSuggestionId(s.id)}
                            className="w-full text-left p-2 rounded-md border border-[#ebebeb] hover:border-[#027e6f] hover:bg-[#e6f4f2]/20 transition-all text-xs flex items-center justify-between gap-2 group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[#0e101a] truncate text-[11px]">{s.title}</p>
                              <p className="text-[10px] text-[#707070] truncate font-mono">{s.targetText}</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#027e6f] group-hover:underline flex-none">Fix →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Integrity View (Crossref + Retractions) */}
              {inspectorTab === "integrity" && (
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
                  <CrossrefPanel data={auditData} />
                </div>
              )}

              {/* Tab 3: Analytics View (Diagnostics, Recency, Structure) */}
              {inspectorTab === "analytics" && (
                <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1">
                  <OverviewPanel data={auditData} mode={mode} />
                  <RecencyPanel data={auditData} />
                  <StructurePanel data={auditData} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Academic Export Suite */}
        <div className="pt-2">
          <DocumentExportSuite
            data={auditData}
            manuscriptText={currentText}
            documentName={documentName}
          />
        </div>
      </div>
    </section>
  );
};

export default ManuscriptEditorWorkspace;
