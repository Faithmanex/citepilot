"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AuditResponse, CitationStyle, AuditMode } from "@/lib/types";
import { normalizeCitationStyle } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAudit } from "@/lib/useAudit";
import { countFindings } from "@/lib/auditState";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import InputArea from "./InputArea";
import ExportPanel from "./ExportPanel";
import HistoryPanel from "./HistoryPanel";
import ManuscriptEditorWorkspace from "./editor/ManuscriptEditorWorkspace";
import { extractDocxSemantic } from "@/lib/editor/docxExtractor";
import AuthModal from "../auth/AuthModal";
import SubscriptionModal from "../subscription/SubscriptionModal";
import Modal from "../ui/Modal";
import { AlertOctagon, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface LegacyAuditView {
  documentName: string;
  data: AuditResponse;
}

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
  const [fileError, setFileError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [legacyAudit, setLegacyAudit] = useState<LegacyAuditView | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const hasDocument = Boolean(manuscriptText.trim() || uploadedFile);
  const documentName = uploadedFile
    ? uploadedFile.name
    : legacyAudit
      ? legacyAudit.documentName
      : manuscriptText.trim()
        ? "Pasted manuscript"
        : "No document loaded";

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4500);
  }, []);

  const handleAuditSuccess = useCallback((data: AuditResponse) => {
    // Never overwrite the manuscript with an empty server field.
    const returnedText = data.text || data.manuscript_text;
    if (returnedText) setManuscriptText(returnedText);
    setAnalysisData(data);
    setLegacyAudit(null);
    setShowInput(false);
    setActivePanel("editor");
  }, []);

  const {
    summary,
    progress,
    errorModal,
    isRunning,
    runAudit,
    retry,
    closeErrorModal,
    replaceDocument,
    loadResult,
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

  const handleModeChange = useCallback((newMode: AuditMode) => {
    setCurrentMode(newMode);
  }, []);

  const handleStyleChange = useCallback((newStyle: CitationStyle) => {
    setStyle(normalizeCitationStyle(newStyle));
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setFileError(null);
      setLegacyAudit(null);
      setAnalysisData(null);
      replaceDocument(true);
      // A newly selected file replaces pasted text; the input area states
      // which source will be analysed.
      setManuscriptText("");
      setManuscriptHtml(undefined);
      setUploadedFile(file);
      setShowInput(false);
      const fileName = file.name.toLowerCase();

      try {
        if (fileName.endsWith(".docx")) {
          const extracted = await extractDocxSemantic(file);
          if (!extracted || !extracted.text.trim()) {
            setFileError(
              "No text could be read from this DOCX. It may contain only images or an unsupported structure."
            );
            setUploadedFile(null);
            setShowInput(true);
            return;
          }
          setManuscriptText(extracted.text);
          setManuscriptHtml(extracted.html);
          showToast(`Loaded ${file.name}`);
        } else if (
          fileName.endsWith(".txt") ||
          fileName.endsWith(".rtf") ||
          fileName.endsWith(".bib")
        ) {
          const text = await file.text();
          setManuscriptText(text);
          setManuscriptHtml(undefined);
          showToast(`Loaded ${file.name}`);
        } else {
          // PDFs are parsed on the server; nothing to extract locally.
          showToast(`Attached ${file.name}. It will be parsed when the audit runs.`);
        }
      } catch (err) {
        console.warn("File read warning:", err);
        setFileError(
          "This file could not be read in the browser. It may be corrupt or password-protected."
        );
        setUploadedFile(null);
        setShowInput(true);
      }
    },
    [replaceDocument, showToast]
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setManuscriptText(text);
      setLegacyAudit(null);
      if (uploadedFile) {
        // Last input wins: pasted/typed text replaces a previously selected file.
        setUploadedFile(null);
      }
    },
    [uploadedFile]
  );

  // Clear behaviour: substantive work requires confirmation.
  const requestClear = useCallback(() => {
    if (hasDocument) {
      setConfirmClear(true);
    } else {
      setManuscriptText("");
      setUploadedFile(null);
      setManuscriptHtml(undefined);
      setAnalysisData(null);
      setLegacyAudit(null);
    }
  }, [hasDocument]);

  const performClear = useCallback(() => {
    setUploadedFile(null);
    setManuscriptText("");
    setManuscriptHtml(undefined);
    setAnalysisData(null);
    setLegacyAudit(null);
    setFileError(null);
    setConfirmClear(false);
    setShowInput(true);
    replaceDocument(false, { text: "", file: null });
    showToast("Document cleared. You can add a new one.");
  }, [replaceDocument, showToast]);

  // Keyboard shortcut (Cmd/Ctrl + Enter). Duplicate submissions are rejected
  // inside useAudit, so holding the shortcut cannot fan out requests.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (hasDocument) void runAudit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runAudit, hasDocument]);

  const handleLoadAudit = useCallback(
    (audit: {
      results: AuditResponse;
      document_name: string;
      citation_style: string;
      audit_mode: string;
    }) => {
      const loadedStyle = normalizeCitationStyle(audit.citation_style);
      const loadedMode: AuditMode =
        audit.audit_mode === "reference_only" ? "reference_only" : "full";
      const storedText = audit.results.text || audit.results.manuscript_text || "";

      setStyle(loadedStyle);
      setCurrentMode(loadedMode);
      setUploadedFile(null);
      setManuscriptHtml(undefined);
      setActivePanel("editor");

      if (storedText.trim()) {
        setManuscriptText(storedText);
        setAnalysisData(audit.results);
        setLegacyAudit(null);
        replaceDocument(true, { text: storedText, file: null });
        const checks = audit.results.checks || [];
        loadResult({
          data: audit.results,
          checks,
          status: audit.results.status === "partial" ? "partial" : "completed",
          style: loadedStyle,
          mode: loadedMode,
        });
        setShowInput(false);
        showToast(`Loaded ${audit.document_name}`);
      } else {
        // Older saved audits never stored the manuscript text. Never attach
        // these findings to whatever text happens to be in the editor.
        setManuscriptText("");
        setAnalysisData(null);
        setLegacyAudit({ documentName: audit.document_name, data: audit.results });
        replaceDocument(false, { text: "", file: null });
        setShowInput(false);
        showToast("Loaded a saved report that does not include its manuscript text.");
      }
    },
    [loadResult, replaceDocument, showToast]
  );

  const stale = summary.freshness === "stale";
  const StatusIcon =
    summary.tone === "error"
      ? AlertOctagon
      : summary.tone === "warning"
        ? AlertTriangle
        : summary.tone === "info"
          ? Loader2
          : CheckCircle2;

  return (
    <div className="dash-body bg-[#f1ebdc] text-[#221d16] min-h-screen selection:bg-[#e7e9f5] selection:text-[#2c3e8c] font-sans">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div id="app-shell" className="flex flex-col md:grid md:grid-cols-[240px_1fr] min-h-screen">
        <Sidebar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onOpenSubscription={() => setSubscriptionModalOpen(true)}
        />
        <main
          id="dashboard-main"
          className="min-w-0 w-full bg-[#f1ebdc] flex flex-col"
          role="main"
        >
          <Topbar
            mode={currentMode}
            onModeChange={handleModeChange}
            style={style}
            onStyleChange={handleStyleChange}
            onRunAudit={() => void runAudit()}
            hasDocument={hasDocument}
            documentName={documentName}
            onClearDocument={requestClear}
            progress={progress}
            onToggleMobileSidebar={() => setMobileNavOpen((prev) => !prev)}
            mobileNavOpen={mobileNavOpen}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenSubscription={() => setSubscriptionModalOpen(true)}
          />

          <div
            id="main-content"
            tabIndex={-1}
            className="flex-1 px-4 sm:px-8 py-6 pb-20 max-w-7xl w-full mx-auto space-y-6"
          >
            <h1 className="sr-only">Citation audit workspace</h1>

            {/* Status banner: always tells the user what state the audit is in. */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs ${
                summary.tone === "error"
                  ? "bg-[#f3dcd6] border-[#ddb3aa] text-[#7d1f18]"
                  : summary.tone === "warning"
                    ? "bg-[#f1e4c8] border-[#ecd9a8] text-[#7a530c]"
                    : summary.tone === "success"
                      ? "bg-[#dee8dd] border-[#bfd3c0] text-[#2f5339]"
                      : summary.tone === "info"
                        ? "bg-[#e7e9f5] border-[#c9cee8] text-[#24357a]"
                        : "bg-[#faf6ec] border-[#d9cfb8] text-[#5c5344]"
              }`}
            >
              <StatusIcon
                className={`w-4 h-4 flex-none mt-0.5 ${
                  summary.tone === "info" ? "animate-spin motion-reduce:animate-none" : ""
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="font-bold" data-testid="audit-state-headline">
                  {summary.headline}
                </p>
                <p>{summary.description}</p>
              </div>
            </div>

            {fileError && (
              <p
                role="alert"
                className="text-xs font-semibold text-[#a32b21] bg-[#f3dcd6] border border-[#ddb3aa] rounded-lg p-3"
              >
                {fileError}
              </p>
            )}

            {legacyAudit && (
              <div className="bg-[#ffffff] border border-[#ecd9a8] rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-bold text-[#221d16]">
                  Saved report: {legacyAudit.documentName}
                </h2>
                <p className="text-xs text-[#5c5344]">
                  This saved report does not include the manuscript text, so its
                  findings cannot be shown against the document. It recorded{" "}
                  {countFindings(legacyAudit.data)} findings,{" "}
                  {legacyAudit.data.citations?.length ?? 0} citations, and{" "}
                  {legacyAudit.data.references?.length ?? 0} references. Paste the
                  manuscript and run a new audit to restore editable findings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLegacyAudit(null);
                    setShowInput(true);
                  }}
                  className="min-h-11 px-4 rounded-lg bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold cursor-pointer"
                >
                  Add the manuscript
                </button>
              </div>
            )}

            {/* Editor panel stays mounted so drafts, accepted fixes, and
                dismissed findings survive panel switches. */}
            <div hidden={activePanel !== "editor"}>
              {showInput && (
                <div className="space-y-3">
                  <InputArea
                    text={manuscriptText}
                    fileName={uploadedFile?.name ?? null}
                    onFileSelect={(file) => void handleFileSelect(file)}
                    onTextChange={handleTextChange}
                    onClear={requestClear}
                    disabled={isRunning}
                  />
                  {hasDocument && (
                    <button
                      type="button"
                      onClick={() => setShowInput(false)}
                      className="text-xs font-bold text-[#2c3e8c] underline min-h-11 px-2 rounded-lg cursor-pointer"
                    >
                      Hide input and review the document
                    </button>
                  )}
                </div>
              )}

              {!showInput && hasDocument && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setShowInput(true)}
                    className="text-xs font-bold text-[#2c3e8c] underline min-h-11 px-2 rounded-lg cursor-pointer"
                  >
                    Add or replace document
                  </button>
                </div>
              )}

              {progress.visible && !analysisData && (
                <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-hidden="true">
                  <div className="h-32 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-7 h-64 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                    <div className="lg:col-span-5 h-64 bg-[#ffffff] border border-[#d9cfb8] rounded-lg" />
                  </div>
                </div>
              )}

              {hasDocument && !manuscriptText.trim() && uploadedFile ? (
                <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-6 space-y-2">
                  <h2 className="text-sm font-bold text-[#221d16]">
                    File attached: {uploadedFile.name}
                  </h2>
                  <p className="text-xs text-[#5c5344]">
                    {uploadedFile.name.toLowerCase().endsWith(".pdf")
                      ? "PDF text is extracted on the server. Run the audit to parse the document and produce findings."
                      : "Run the audit to analyse this file."}
                  </p>
                </div>
              ) : hasDocument ? (
                <ManuscriptEditorWorkspace
                  initialText={manuscriptText}
                  initialHtml={manuscriptHtml}
                  auditData={analysisData}
                  audit={summary}
                  isStale={stale}
                  documentName={documentName}
                  onTextChange={handleTextChange}
                  onRequestReAudit={() => void runAudit()}
                />
              ) : null}
            </div>

            {activePanel === "history" && (
              <HistoryPanel
                onLoadAudit={handleLoadAudit}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {activePanel === "export" && (
              <ExportPanel
                data={analysisData}
                audit={summary}
                manuscriptText={manuscriptText}
                documentName={documentName}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast notification */}
      <div
        id="toast"
        className={`fixed bottom-6 right-6 max-w-sm bg-[#ffffff] border border-[#d9cfb8] text-[#221d16] px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2.5 shadow-none z-50 transition-all duration-300 motion-reduce:transition-none ${
          toastVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-4 h-4 text-[#2c3e8c] flex-none" aria-hidden="true" />
        <span>{toastMsg}</span>
      </div>

      {/* Error dialog */}
      <Modal
        open={errorModal.visible}
        onClose={closeErrorModal}
        title={errorModal.title}
        description="Your manuscript is preserved in the editor."
        initialFocusId={errorModal.retryable ? "error-retry-button" : "error-dismiss-button"}
        hideCloseButton
      >
        <p className="text-xs text-[#14181f] font-mono bg-[#f3dcd6]/40 p-3.5 rounded-lg border border-[#ddb3aa] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
          {errorModal.message}
        </p>
        {errorModal.requestId && (
          <p className="text-[11px] text-[#5c5344] mt-2 font-mono">
            Request ID: {errorModal.requestId}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
          <button
            id="error-dismiss-button"
            type="button"
            onClick={closeErrorModal}
            className="min-h-11 px-4 rounded-lg border border-[#8f836c] text-xs font-bold text-[#221d16] bg-white hover:bg-[#faf6ec] cursor-pointer"
          >
            Dismiss
          </button>
          {errorModal.retryable && (
            <button
              id="error-retry-button"
              type="button"
              onClick={() => {
                closeErrorModal();
                void retry();
              }}
              className="min-h-11 px-4 rounded-lg bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold cursor-pointer"
            >
              Retry audit
            </button>
          )}
        </div>
      </Modal>

      {/* Clear confirmation */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear this document?"
        description="The manuscript text, accepted fixes, and current audit results will be removed from this workspace."
        initialFocusId="confirm-clear-cancel"
        dismissOnBackdrop={false}
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            id="confirm-clear-cancel"
            type="button"
            onClick={() => setConfirmClear(false)}
            className="min-h-11 px-4 rounded-lg border border-[#8f836c] text-xs font-bold text-[#221d16] bg-white hover:bg-[#faf6ec] cursor-pointer"
          >
            Keep document
          </button>
          <button
            type="button"
            onClick={performClear}
            className="min-h-11 px-4 rounded-lg bg-[#a32b21] hover:bg-[#7d1f18] text-white text-xs font-bold cursor-pointer"
          >
            Clear and start over
          </button>
        </div>
      </Modal>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => showToast("Signed in successfully!")}
      />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </div>
  );
}
