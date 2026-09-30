"use client";

import { useState, useCallback, useEffect } from "react";
import type { AuditResponse, CitationStyle, AuditMode } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAudit } from "@/lib/useAudit";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import InputArea from "./InputArea";
import ExportPanel from "./ExportPanel";
import HistoryPanel from "./HistoryPanel";
import ManuscriptEditorWorkspace from "./editor/ManuscriptEditorWorkspace";
import { extractDocxSemantic } from "@/lib/editor/docxExtractor";
import AuthModal from "../auth/AuthModal";
import SubscriptionModal from "../subscription/SubscriptionModal";
import { AlertOctagon, CheckCircle2 } from "lucide-react";

export default function DashboardView() {
  const { user, isPro } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("editor");
  const [currentMode, setCurrentMode] = useState<AuditMode>("full");
  const [style, setStyle] = useState<CitationStyle>("apa7");
  const [analysisData, setAnalysisData] = useState<AuditResponse | null>(null);
  const [manuscriptText, setManuscriptText] = useState("");
  const [manuscriptHtml, setManuscriptHtml] = useState<string | undefined>(undefined);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const hasDocument = !!(uploadedFile || manuscriptText.trim());
  const documentName = uploadedFile
    ? uploadedFile.name
    : manuscriptText.trim()
      ? "Pasted manuscript"
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
        showToast(`Switched to ${isRefOnly ? "references only" : "whole document"}.`);
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
          const extracted = await extractDocxSemantic(file);
          if (extracted && extracted.text.trim()) {
            setManuscriptText(extracted.text);
            setManuscriptHtml(extracted.html);
            showToast(`Loaded ${file.name}`);
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
          if (e.target?.result) {
            setManuscriptText(e.target.result as string);
            setManuscriptHtml(undefined);
          }
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
    setManuscriptHtml(undefined);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + Enter to run)
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
    setActivePanel("editor");
    showToast(`Loaded ${audit.document_name}`);
  }, [showToast]);

  return (
    <div className="dash-body bg-[#f1ebdc] text-[#221d16] min-h-screen selection:bg-[#e7e9f5] selection:text-[#2c3e8c] font-sans">
      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] min-h-screen">
        <Sidebar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onOpenSubscription={() => setSubscriptionModalOpen(true)}
        />
        <main className="min-w-0 w-full bg-[#f1ebdc] flex flex-col" role="main">
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
          />

          <div className="flex-1 px-4 sm:px-8 py-6 pb-20 max-w-7xl w-full mx-auto space-y-6">
            {activePanel === "editor" && (
              <>
                {!hasDocument ? (
                  <InputArea
                    onFileSelect={handleFileSelect}
                    onTextChange={handleTextChange}
                    onClear={handleClearDocument}
                    hasFile={!!uploadedFile}
                    hasText={!!manuscriptText.trim()}
                  />
                ) : (
                  <details className="group bg-[#faf6ec] border border-[#d9cfb8] rounded-lg overflow-hidden transition-all">
                    <summary className="px-4 py-2.5 cursor-pointer text-xs font-semibold text-[#5c5344] hover:text-[#221d16] flex items-center justify-between select-none">
                      <span>Replace document</span>
                      <span className="text-[10px] text-[#948a76] group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 border-t border-[#d9cfb8] bg-white">
                      <InputArea
                        onFileSelect={handleFileSelect}
                        onTextChange={handleTextChange}
                        onClear={handleClearDocument}
                        hasFile={!!uploadedFile}
                        hasText={!!manuscriptText.trim()}
                      />
                    </div>
                  </details>
                )}

                {progress.visible ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-32 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-7 h-64 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                      <div className="lg:col-span-5 h-64 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                    </div>
                  </div>
                ) : hasDocument ? (
                  <ManuscriptEditorWorkspace
                    initialText={manuscriptText}
                    initialHtml={manuscriptHtml}
                    auditData={analysisData}
                    documentName={documentName}
                    onTextChange={handleTextChange}
                    onRequestReAudit={() => runAudit()}
                  />
                ) : null}
              </>
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
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <div
        id="toast"
        className={`fixed bottom-6 right-6 bg-[#ffffff] border border-[#d9cfb8] text-[#221d16] px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2.5 shadow-none z-50 transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-4 h-4 text-[#2c3e8c]" />
        <span id="toast-msg">{toastMsg}</span>
      </div>

      {/* Error Modal */}
      {errorModal.visible && (
        <div
          className="fixed inset-0 bg-[#221d16]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div className="bg-[#ffffff] border border-[#ddb3aa] rounded-lg max-w-lg w-full p-6 shadow-none space-y-4">
            <h2
              id="error-modal-title"
              className="text-[#a32b21] font-extrabold text-base flex items-center gap-2"
            >
              <AlertOctagon className="w-5 h-5 text-[#a32b21]" />
              {errorModal.title || "Audit error"}
            </h2>
            <p
              tabIndex={0}
              className="text-xs text-[#14181f] font-mono bg-[#f3dcd6]/40 p-3.5 rounded-lg border border-[#ddb3aa] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap"
            >
              {errorModal.message}
            </p>
            <div className="text-right pt-2">
              <button
                className="px-4 py-2 bg-[#221d16] hover:bg-[#14181f] text-white font-bold text-xs rounded-lg border border-[#221d16] transition-colors cursor-pointer"
                onClick={closeErrorModal}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
