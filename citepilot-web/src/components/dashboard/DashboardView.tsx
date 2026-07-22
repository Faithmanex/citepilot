"use client";

import { useState, useCallback } from "react";
import type { AuditResponse, CitationStyle, AuditMode } from "@/lib/types";
import { runAudit } from "@/lib/api";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import InputArea from "./InputArea";
import OverviewPanel from "./OverviewPanel";
import MatchingPanel from "./MatchingPanel";
import CrossrefPanel from "./CrossrefPanel";
import StylePanel from "./StylePanel";
import ClaimsPanel from "./ClaimsPanel";
import RecencyPanel from "./RecencyPanel";
import StructurePanel from "./StructurePanel";
import ExportPanel from "./ExportPanel";

export default function DashboardView() {
  const [activePanel, setActivePanel] = useState("overview");
  const [currentMode, setCurrentMode] = useState<AuditMode>("full");
  const [style, setStyle] = useState<CitationStyle>("apa7");
  const [analysisData, setAnalysisData] = useState<AuditResponse | null>(null);
  const [manuscriptText, setManuscriptText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [progress, setProgress] = useState({
    visible: false,
    message: "Parsing document…",
    pct: 0,
  });
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const hasDocument = !!(uploadedFile || manuscriptText.trim());
  const documentName = uploadedFile
    ? uploadedFile.name
    : manuscriptText.trim()
      ? "Pasted Manuscript"
      : "No document loaded";

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handlePanelChange = useCallback((panel: string) => {
    setActivePanel(panel);
  }, []);

  const handleModeChange = useCallback(
    (newMode: AuditMode) => {
      setCurrentMode(newMode);
      if (analysisData) {
        const isRefOnly = newMode === "reference_only";
        const citations = analysisData.citations ?? [];
        const refs = analysisData.references ?? [];
        showToast(
          `Switched to ${isRefOnly ? "Reference-List-Only" : "Full Manuscript"} mode.`
        );
      }
    },
    [analysisData, showToast]
  );

  const handleStyleChange = useCallback((newStyle: CitationStyle) => {
    setStyle(newStyle);
  }, []);

  const handleToggleInput = useCallback(() => {
    setInputCollapsed((prev) => !prev);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setManuscriptText("");
    if (file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".rtf")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setManuscriptText(e.target.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setManuscriptText(text);
  }, []);

  const handleClearDocument = useCallback(() => {
    setUploadedFile(null);
    setManuscriptText("");
  }, []);

  const handleRunAudit = useCallback(async () => {
    const textVal = manuscriptText.trim();
    if (!textVal && !uploadedFile) {
      showToast("Please upload a file or paste manuscript text.");
      return;
    }

    setInputCollapsed(true);
    setProgress({ visible: true, message: "Parsing document structure…", pct: 20 });

    const formData = new FormData();
    if (uploadedFile) formData.append("file", uploadedFile);
    if (textVal) formData.append("text", textVal);
    formData.append("citation_style", style);
    formData.append("mode", currentMode);

    try {
      setProgress((p) => ({
        ...p,
        message: "Extracting citations & querying Crossref API…",
        pct: 65,
      }));
      const data = await runAudit(formData);
      if (data.text || data.manuscript_text) {
        setManuscriptText(data.text || data.manuscript_text || "");
      }
      setAnalysisData(data);
      setProgress({ visible: false, message: "Done!", pct: 100 });
      showToast("Audit finished successfully!");
    } catch (err) {
      setProgress({ visible: false, message: "", pct: 0 });
      const msg = (err as Error).message;
      showToast("Error running audit: " + msg);
      setErrorModal({
        visible: true,
        title: "Audit Analysis Error",
        message: msg,
      });
    }
  }, [manuscriptText, uploadedFile, style, currentMode, showToast]);

  const handleCloseErrorModal = useCallback(() => {
    setErrorModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const badges: Record<string, number> = (() => {
    if (!analysisData) return { matching: 0, crossref: 0, style: 0, claims: 0 };
    const citations = analysisData.citations ?? [];
    const refs = analysisData.references ?? [];
    const warnings = analysisData.style_warnings ?? [];
    const claims = analysisData.uncited_claims ?? [];
    const missingRefs = citations.filter((c) => c.status === "no_match").length;
    const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
    const spellingMismatches = citations.filter((c) =>
      (c.issues ?? []).some(
        (i) =>
          i.type === "spelling_mismatch" ||
          i.code === "SPELLING_MISMATCH" ||
          c.match_type === "fuzzy"
      )
    ).length;
    const yearMismatches = citations.filter((c) =>
      (c.issues ?? []).some(
        (i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH"
      )
    ).length;
    const retractedCount = refs.filter((r) => r.status === "retracted").length;
    const crDiscrepancies = refs.reduce(
      (acc, r) => acc + (r.crossref_validation?.discrepancies?.length ?? 0),
      0
    );
    return {
      matching: missingRefs + uncitedRefs + spellingMismatches + yearMismatches,
      crossref: retractedCount + crDiscrepancies,
      style: warnings.length,
      claims: claims.length,
    };
  })();

  return (
    <div className="dash-body" style={{ background: "var(--color-dash-paper)" }}>
      <div className="grid min-h-screen" style={{ gridTemplateColumns: "236px 1fr" }}>
        <Sidebar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          badges={badges}
        />
        <main className="min-w-0" role="main">
          <Topbar
            mode={currentMode}
            onModeChange={handleModeChange}
            style={style}
            onStyleChange={handleStyleChange}
            onRunAudit={handleRunAudit}
            onToggleInput={handleToggleInput}
            inputCollapsed={inputCollapsed}
            hasDocument={hasDocument}
            documentName={documentName}
            onClearDocument={handleClearDocument}
            progress={progress}
          />
          <div className="px-7 py-[26px] pb-16">
            <InputArea
              collapsed={inputCollapsed}
              onToggleCollapse={handleToggleInput}
              onFileSelect={handleFileSelect}
              onTextChange={handleTextChange}
              onClear={handleClearDocument}
              hasFile={!!uploadedFile}
              hasText={!!manuscriptText.trim()}
            />

            {activePanel === "overview" && (
              <OverviewPanel data={analysisData} mode={currentMode} />
            )}
            {activePanel === "matching" && (
              <MatchingPanel data={analysisData} />
            )}
            {activePanel === "crossref" && (
              <CrossrefPanel data={analysisData} />
            )}
            {activePanel === "style" && <StylePanel data={analysisData} />}
            {activePanel === "claims" && <ClaimsPanel data={analysisData} />}
            {activePanel === "recency" && <RecencyPanel data={analysisData} />}
            {activePanel === "structure" && (
              <StructurePanel data={analysisData} />
            )}
            {activePanel === "export" && (
              <ExportPanel
                data={analysisData}
                manuscriptText={manuscriptText}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      <div
        id="toast"
        className={`fixed bottom-6 right-7 bg-ink text-white px-5 py-3.5 rounded-lg text-[13.5px] font-bold flex items-center gap-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] z-200 transition-all duration-300 ease ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="w-2 h-2 rounded-full bg-verified" aria-hidden="true" />
        <span id="toast-msg">{toastMsg}</span>
      </div>

      {/* Error Modal */}
      {errorModal.visible && (
        <div
          className="fixed inset-0 bg-black/50 z-300 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div className="bg-card border-2 border-error rounded-lg max-w-[520px] w-[90%] p-6 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <h2
              id="error-modal-title"
              className="text-error mt-0 text-lg flex items-center gap-2"
            >
              <i className="fas fa-exclamation-triangle" aria-hidden="true" />{" "}
              {errorModal.title || "API Request Error"}
            </h2>
            <p
              tabIndex={0}
              className="text-[13.5px] text-dash-ink leading-[1.5] my-4 max-h-[220px] overflow-y-auto font-mono bg-dash-paper p-3 rounded-[4px] border border-line whitespace-pre-wrap"
            >
              {errorModal.message}
            </p>
            <div className="text-right">
              <button
                className="btn-dash"
                style={{
                  background: "var(--color-dash-ink)",
                  borderColor: "var(--color-dash-ink)",
                }}
                onClick={handleCloseErrorModal}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
