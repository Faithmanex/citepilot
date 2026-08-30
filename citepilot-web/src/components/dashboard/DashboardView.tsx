"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { AuditResponse, CitationStyle, AuditMode } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAudit } from "@/lib/useAudit";
import { computeAuditStats } from "@/lib/auditStats";
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
import HistoryPanel from "./HistoryPanel";
import ManuscriptEditorWorkspace from "./editor/ManuscriptEditorWorkspace";
import ReplaceDocumentModal from "./ReplaceDocumentModal";
import { extractTextFromDocx } from "@/lib/editor/docxExtractor";
import AuthModal from "../auth/AuthModal";
import SubscriptionModal from "../subscription/SubscriptionModal";
import { AlertOctagon, CheckCircle2 } from "lucide-react";

export default function DashboardView() {
  const { user, isPro } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("workspace");
  const [currentMode, setCurrentMode] = useState<AuditMode>("full");
  const [style, setStyle] = useState<CitationStyle>("apa7");
  const [analysisData, setAnalysisData] = useState<AuditResponse | null>(null);
  const [manuscriptText, setManuscriptText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

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

  const handleAuditSuccess = useCallback((data: AuditResponse) => {
    if (data.text || data.manuscript_text) {
      setManuscriptText(data.text || data.manuscript_text || "");
    }
    setAnalysisData(data);
  }, []);

  const {
    progress,
    errorModal,
    runAudit,
    closeErrorModal,
  } = useAudit({
    text: manuscriptText,
    file: uploadedFile,
    style,
    mode: currentMode,
    documentName,
    isPro,
    user,
    showToast,
    onSuccess: handleAuditSuccess,
    onUpgradeRequired: () => setSubscriptionModalOpen(true),
  });

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

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".docx")) {
        try {
          const extracted = await extractTextFromDocx(file);
          if (extracted && extracted.trim()) {
            setManuscriptText(extracted);
            showToast(`Loaded ${file.name} in realtime editor`);
          }
        } catch (err) {
          console.warn("Realtime docx extraction warning:", err);
        }
      } else if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".rtf") ||
        fileName.endsWith(".bib")
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setManuscriptText(e.target.result as string);
        };
        reader.readAsText(file);
      }
    },
    [showToast]
  );


  const handleTextChange = useCallback((text: string) => {
    setManuscriptText(text);
  }, []);

  const handleClearDocument = useCallback(() => {
    setUploadedFile(null);
    setManuscriptText("");
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + Enter to trigger audit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runAudit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runAudit]);

  const handleLoadAudit = useCallback((audit: { results: AuditResponse; document_name: string; citation_style: string; audit_mode: string }) => {
    setAnalysisData(audit.results);
    setStyle(audit.citation_style as CitationStyle);
    setCurrentMode(audit.audit_mode as AuditMode);
    if (audit.results.text || audit.results.manuscript_text) {
      setManuscriptText(audit.results.text || audit.results.manuscript_text || "");
    }
    setActivePanel("workspace");
    showToast(`Loaded audit: ${audit.document_name}`);
  }, [showToast]);

  const totalIssues = useMemo(() => {
    if (!analysisData) return 0;
    const stats = computeAuditStats(analysisData);
    return (
      (stats.matching ?? 0) +
      (stats.crossref ?? 0) +
      (stats.style ?? 0) +
      (stats.claims ?? 0)
    );
  }, [analysisData]);

  const badges = useMemo(() => ({
    ...computeAuditStats(analysisData),
    totalIssues,
  }), [analysisData, totalIssues]);

  return (
    <div className="dash-body bg-[#ffffff] text-[#0e101a] min-h-screen selection:bg-[#e6f4f2] selection:text-[#027e6f] font-sans">
      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] min-h-screen">
        <Sidebar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          badges={badges}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onOpenSubscription={() => setSubscriptionModalOpen(true)}
        />
        <main className="min-w-0 w-full bg-[#ffffff] flex flex-col" role="main">
          <Topbar
            mode={currentMode}
            onModeChange={handleModeChange}
            style={style}
            onStyleChange={handleStyleChange}
            onRunAudit={runAudit}
            hasDocument={hasDocument}
            documentName={documentName}
            onClearDocument={handleClearDocument}
            progress={progress}
            onToggleMobileSidebar={() => setMobileNavOpen((prev) => !prev)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenSubscription={() => setSubscriptionModalOpen(true)}
            onOpenReplaceModal={() => setReplaceModalOpen(true)}
          />

          <div className="flex-1 px-4 sm:px-8 py-6 pb-20 max-w-7xl w-full mx-auto space-y-6">
            {!hasDocument && (
              <InputArea
                onFileSelect={handleFileSelect}
                onTextChange={handleTextChange}
                onClear={handleClearDocument}
                hasFile={!!uploadedFile}
                hasText={!!manuscriptText.trim()}
              />
            )}

            {/* Shimmer Skeleton Loader state when audit is running */}
            {progress.visible ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="h-28 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
                  <div className="h-28 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
                  <div className="h-28 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
                  <div className="h-28 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
                </div>
                <div className="h-64 bg-[#ffffff] border border-[#ebebeb] rounded-lg" />
              </div>
            ) : (
              <>
                {(activePanel === "workspace" || activePanel === "overview") && (
                  hasDocument ? (
                    <ManuscriptEditorWorkspace
                      initialText={manuscriptText}
                      auditData={analysisData}
                      documentName={documentName}
                      mode={currentMode}
                      onTextChange={handleTextChange}
                      onRequestReAudit={() => runAudit()}
                    />
                  ) : (
                    <OverviewPanel data={analysisData} mode={currentMode} />
                  )
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
                {activePanel === "history" && (
                  <HistoryPanel
                    onLoadAudit={handleLoadAudit}
                    onOpenAuth={() => setAuthModalOpen(true)}
                  />
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
        className={`fixed bottom-6 right-6 bg-[#ffffff] border border-[#ebebeb] text-[#0e101a] px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2.5 shadow-none z-50 transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-4 h-4 text-[#027e6f]" />
        <span id="toast-msg">{toastMsg}</span>
      </div>

      {/* Error Modal */}
      {errorModal.visible && (
        <div
          className="fixed inset-0 bg-[#0e101a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div className="bg-[#ffffff] border border-[#fca5a5] rounded-lg max-w-lg w-full p-6 shadow-none space-y-4">
            <h2
              id="error-modal-title"
              className="text-[#b91c1c] font-extrabold text-base flex items-center gap-2"
            >
              <AlertOctagon className="w-5 h-5 text-[#b91c1c]" />
              {errorModal.title || "Audit Error"}
            </h2>
            <p
              tabIndex={0}
              className="text-xs text-[#1f243c] font-mono bg-[#fee2e2]/40 p-3.5 rounded-lg border border-[#fca5a5] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap"
            >
              {errorModal.message}
            </p>
            <div className="text-right pt-2">
              <button
                className="px-4 py-2 bg-[#0e101a] hover:bg-[#1f243c] text-white font-bold text-xs rounded-lg border border-[#0e101a] transition-colors cursor-pointer"
                onClick={closeErrorModal}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Document Modal */}
      <ReplaceDocumentModal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        onFileSelect={handleFileSelect}
        onTextChange={handleTextChange}
        onClear={handleClearDocument}
        hasFile={!!uploadedFile}
        hasText={!!manuscriptText.trim()}
        documentName={documentName}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => showToast("Signed in successfully!")}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </div>
  );
}
