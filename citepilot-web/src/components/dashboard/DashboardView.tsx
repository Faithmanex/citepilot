"use client";

import { useState, useCallback, useEffect } from "react";
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
import SubscriptionModal from "../subscription/SubscriptionModal";
import { AlertOctagon, CheckCircle2 } from "lucide-react";

export default function DashboardView() {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");
  const [currentMode, setCurrentMode] = useState<AuditMode>("full");
  const [style, setStyle] = useState<CitationStyle>("apa7");
  const [analysisData, setAnalysisData] = useState<AuditResponse | null>(null);
  const [manuscriptText, setManuscriptText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const handlePanelChange = useCallback((panel: string) => {
    setActivePanel(panel);
    setMobileNavOpen(false);
  }, []);

  const handleModeChange = useCallback(
    (newMode: AuditMode) => {
      setCurrentMode(newMode);
      if (analysisData) {
        const isRefOnly = newMode === "reference_only";
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

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setManuscriptText("");
    if (
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".rtf") ||
      file.name.toLowerCase().endsWith(".bib")
    ) {
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
      showToast("Please upload a document file or paste manuscript text.");
      return;
    }

    setProgress({ visible: true, message: "Extracting manuscript structure & AST…", pct: 25 });

    const formData = new FormData();
    if (uploadedFile) formData.append("file", uploadedFile);
    if (textVal) formData.append("text", textVal);
    formData.append("citation_style", style);
    formData.append("mode", currentMode);

    try {
      setProgress((p) => ({
        ...p,
        message: "Matching citations & querying Crossref APIs…",
        pct: 70,
      }));
      const data = await runAudit(formData);
      if (data.text || data.manuscript_text) {
        setManuscriptText(data.text || data.manuscript_text || "");
      }
      setAnalysisData(data);
      setProgress({ visible: false, message: "Audit Complete!", pct: 100 });
      showToast("Manuscript audit completed successfully!");
    } catch (err) {
      setProgress({ visible: false, message: "", pct: 0 });
      const msg = (err as Error).message;
      showToast("Audit Error: " + msg);
      setErrorModal({
        visible: true,
        title: "Audit Execution Error",
        message: msg,
      });
    }
  }, [manuscriptText, uploadedFile, style, currentMode, showToast]);

  // Keyboard shortcut (Cmd/Ctrl + Enter to trigger audit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunAudit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunAudit]);

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
    <div className="dash-body bg-[#F4F3EE] text-ink min-h-screen selection:bg-[#1E5E4B] selection:text-white font-dash">
      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] min-h-screen">
        <Sidebar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          badges={badges}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onOpenSubscription={() => setSubscriptionModalOpen(true)}
        />
        <main className="min-w-0 w-full bg-[#F4F3EE] flex flex-col" role="main">
          <Topbar
            mode={currentMode}
            onModeChange={handleModeChange}
            style={style}
            onStyleChange={handleStyleChange}
            onRunAudit={handleRunAudit}
            hasDocument={hasDocument}
            documentName={documentName}
            onClearDocument={handleClearDocument}
            progress={progress}
            onToggleMobileSidebar={() => setMobileNavOpen((prev) => !prev)}
          />

          <div className="flex-1 px-4 sm:px-8 py-6 pb-20 max-w-7xl w-full mx-auto space-y-6">
            <InputArea
              onFileSelect={handleFileSelect}
              onTextChange={handleTextChange}
              onClear={handleClearDocument}
              hasFile={!!uploadedFile}
              hasText={!!manuscriptText.trim()}
            />

            {/* Shimmer Skeleton Loader state when audit is running */}
            {progress.visible ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="h-28 bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl" />
                  <div className="h-28 bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl" />
                  <div className="h-28 bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl" />
                  <div className="h-28 bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl" />
                </div>
                <div className="h-64 bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <div
        id="toast"
        className={`fixed bottom-6 right-6 bg-[#FAF6EC] border border-[#C7BC9F] text-[#221D16] px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-lg z-50 transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-4 h-4 text-[#1E5E4B]" />
        <span id="toast-msg">{toastMsg}</span>
      </div>

      {/* Error Modal */}
      {errorModal.visible && (
        <div
          className="fixed inset-0 bg-[#221D16]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div className="bg-[#FAF6EC] border border-[#961E14]/40 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2
              id="error-modal-title"
              className="text-[#961E14] font-extrabold text-base flex items-center gap-2"
            >
              <AlertOctagon className="w-5 h-5 text-[#961E14]" />
              {errorModal.title || "Audit Error"}
            </h2>
            <p
              tabIndex={0}
              className="text-xs text-[#353027] font-mono bg-[#F1EBDC] p-3.5 rounded-xl border border-[#C7BC9F] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap"
            >
              {errorModal.message}
            </p>
            <div className="text-right pt-2">
              <button
                className="px-4 py-2 bg-[#221D16] hover:bg-[#353027] text-[#F1EBDC] font-bold text-xs rounded-xl border border-[#221D16] transition-colors cursor-pointer"
                onClick={handleCloseErrorModal}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </div>
  );
}

