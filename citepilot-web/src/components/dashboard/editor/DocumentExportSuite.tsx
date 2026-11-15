"use client";

import React, { useState } from "react";
import { exportPdf, exportDocx } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";
import type { AuditSummary } from "@/lib/auditState";
import {
  FileDown,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Info,
} from "lucide-react";

export interface DocumentExportSuiteProps {
  data: AuditResponse | null;
  audit: AuditSummary;
  manuscriptText: string;
  documentName?: string;
  className?: string;
}

const ExportStatusLine = ({ state }: { state: ExportState }) =>
  state.status === "idle" ? null : (
    <p
      className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${
        state.status === "success" ? "text-[#2c3e8c]" : "text-[#a32b21]"
      }`}
    >
      {state.status === "success" ? (
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      ) : (
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
      )}
      <span>{state.message}</span>
    </p>
  );

type ExportState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

export const DocumentExportSuite: React.FC<DocumentExportSuiteProps> = ({
  data,
  audit,
  manuscriptText,
  documentName = "manuscript",
  className = "",
}) => {
  const [cleanDocxState, setCleanDocxState] = useState<ExportState>({ status: "idle" });
  const [redlineDocxState, setRedlineDocxState] = useState<ExportState>({ status: "idle" });
  const [pdfState, setPdfState] = useState<ExportState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const hasText = Boolean(manuscriptText.trim());
  // Evidence exports require findings for the current revision and settings.
  const hasAuditEvidence = audit.showsResult && Boolean(data) && audit.freshness === "current";
  const evidenceReason = hasAuditEvidence
    ? null
    : audit.freshness === "stale"
      ? "The document or settings were edited after this audit. Re-run the audit before exporting evidence. Plain manuscript export remains available."
      : "Run an audit of the current document and settings to enable audit evidence exports. The plain manuscript export stays available.";

  const baseFileName = documentName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const resetState = (setter: React.Dispatch<React.SetStateAction<ExportState>>) => {
    setTimeout(() => setter({ status: "idle" }), 4000);
  };

  const handleDownloadCleanDocx = async () => {
    if (!hasText) {
      setCleanDocxState({ status: "error", message: "No manuscript text to export." });
      resetState(setCleanDocxState);
      return;
    }
    setCleanDocxState({ status: "loading" });
    try {
      // Clean export is the current editor text, including accepted fixes.
      const blob = await exportDocx(manuscriptText, data, "clean");
      downloadBlob(blob, `${baseFileName}_revised_clean.docx`);
      setCleanDocxState({ status: "success", message: "Clean DOCX downloaded." });
    } catch (err) {
      setCleanDocxState({ status: "error", message: (err as Error).message });
    } finally {
      resetState(setCleanDocxState);
    }
  };

  const handleDownloadRedlineDocx = async () => {
    if (!hasAuditEvidence) {
      setRedlineDocxState({
        status: "error",
        message: "Run an audit first — the annotated export needs findings to annotate.",
      });
      resetState(setRedlineDocxState);
      return;
    }
    setRedlineDocxState({ status: "loading" });
    try {
      const blob = await exportDocx(manuscriptText, data, "redline");
      downloadBlob(blob, `${baseFileName}_redline_annotated.docx`);
      setRedlineDocxState({ status: "success", message: "Annotated DOCX downloaded." });
    } catch (err) {
      setRedlineDocxState({ status: "error", message: (err as Error).message });
    } finally {
      resetState(setRedlineDocxState);
    }
  };

  const handleDownloadPdf = async () => {
    if (!hasAuditEvidence) {
      setPdfState({
        status: "error",
        message: "Run an audit first — the diagnostic report needs audit evidence.",
      });
      resetState(setPdfState);
      return;
    }
    setPdfState({ status: "loading" });
    try {
      const blob = await exportPdf(data as AuditResponse);
      downloadBlob(blob, `${baseFileName}_audit_report.pdf`);
      setPdfState({ status: "success", message: "PDF report downloaded." });
    } catch (err) {
      setPdfState({ status: "error", message: (err as Error).message });
    } finally {
      resetState(setPdfState);
    }
  };

  const handleCopyCleanManuscript = async () => {
    if (!manuscriptText) return;
    try {
      await navigator.clipboard.writeText(manuscriptText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = manuscriptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  return (
    <div
      data-testid="document-export-suite"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#14181f]">
            Academic export suite
          </h3>
          <p className="text-xs text-[#5c5344] mt-0.5">
            Export the current manuscript, or a file that includes audit evidence.
          </p>
        </div>
        <button
          type="button"
          data-testid="copy-manuscript-btn"
          onClick={handleCopyCleanManuscript}
          disabled={!hasText}
          className="min-h-11 text-xs font-bold px-3 py-1.5 rounded-md border border-[#8f836c] hover:border-[#2c3e8c] hover:text-[#2c3e8c] bg-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#2c3e8c]" aria-hidden="true" />
              <span className="text-[#2c3e8c]">Copied to clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy manuscript</span>
            </>
          )}
        </button>
      </div>

      {/* Audit context: what evidence these exports contain. */}
      <div
        className={`rounded-lg border p-3 text-[11px] leading-relaxed ${
          hasAuditEvidence
            ? audit.freshness === "current"
              ? "bg-[#faf6ec] border-[#d9cfb8] text-[#5c5344]"
              : "bg-[#f1e4c8] border-[#ecd9a8] text-[#7a530c]"
            : "bg-[#faf6ec] border-[#d9cfb8] text-[#5c5344]"
        }`}
      >
        <p className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-none mt-0.5" aria-hidden="true" />
          <span>
            {hasAuditEvidence ? (
              <>
                <span className="font-bold">Audit evidence included.</span>{" "}
                {audit.freshness === "current"
                  ? "These exports match the current manuscript revision."
                  : "The manuscript was edited after this audit, so annotated files describe an earlier revision."}
                {audit.incompleteChecks.length > 0
                  ? " Some checks could not complete and are marked unavailable in the report."
                  : ""}
              </>
            ) : (
              <>
                <span className="font-bold">No audit evidence yet.</span>{" "}
                {evidenceReason}
              </>
            )}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Plain manuscript export */}
        <div className="border-2 border-[#2c3e8c]/40 hover:border-[#2c3e8c] bg-[#faf6ec] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#2c3e8c]/10 text-[#2c3e8c] border border-[#2c3e8c]/20">
                No findings
              </span>
              <span className="text-[10px] font-mono font-bold text-[#5c5344]">DOCX</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2c3e8c]" aria-hidden="true" />
              Clean manuscript
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              The current editor text, including accepted fixes. Contains no audit
              annotations.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-clean-docx-btn"
              onClick={handleDownloadCleanDocx}
              disabled={cleanDocxState.status === "loading" || !hasText}
              aria-describedby={!hasText ? "export-clean-unavailable" : undefined}
              className="w-full min-h-11 bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {cleanDocxState.status === "loading" ? "Generating…" : "Download .docx"}
              </span>
            </button>
            {!hasText && (
              <p id="export-clean-unavailable" className="mt-1.5 text-[11px] text-[#5c5344]">
                Add manuscript text to enable this export.
              </p>
            )}
            <div aria-live="polite">
              <ExportStatusLine state={cleanDocxState} />
            </div>
          </div>
        </div>

        {/* Annotated export */}
        <div className="border border-[#d9cfb8] hover:border-[#2c3e8c]/40 bg-[#ffffff] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#f1ebdc] text-[#5c5344]">
                Audit evidence
              </span>
              <span className="text-[10px] font-mono font-bold text-[#5c5344]">DOCX</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-[#5c5344]" aria-hidden="true" />
              Annotated manuscript
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              The manuscript with style findings highlighted and annotated.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-redline-docx-btn"
              onClick={handleDownloadRedlineDocx}
              disabled={redlineDocxState.status === "loading" || !hasAuditEvidence}
              aria-describedby={!hasAuditEvidence ? "export-evidence-unavailable" : undefined}
              className="w-full min-h-11 border border-[#8f836c] hover:bg-[#faf6ec] text-[#221d16] text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {redlineDocxState.status === "loading" ? "Generating…" : "Download .docx"}
              </span>
            </button>
            <div aria-live="polite">
              <ExportStatusLine state={redlineDocxState} />
            </div>
          </div>
        </div>

        {/* PDF report */}
        <div className="border border-[#d9cfb8] hover:border-[#2c3e8c]/40 bg-[#ffffff] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#f1ebdc] text-[#5c5344]">
                Audit evidence
              </span>
              <span className="text-[10px] font-mono font-bold text-[#5c5344]">PDF</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5c5344]" aria-hidden="true" />
              Diagnostic report
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              Findings, verification status, and checks that could not complete.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-pdf-report-btn"
              onClick={handleDownloadPdf}
              disabled={pdfState.status === "loading" || !hasAuditEvidence}
              aria-describedby={!hasAuditEvidence ? "export-evidence-unavailable" : undefined}
              className="w-full min-h-11 border border-[#8f836c] hover:bg-[#faf6ec] text-[#221d16] text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {pdfState.status === "loading" ? "Generating…" : "Download .pdf"}
              </span>
            </button>
            <div aria-live="polite">
              <ExportStatusLine state={pdfState} />
            </div>
          </div>
        </div>
      </div>

      {!hasAuditEvidence && (
        <p id="export-evidence-unavailable" className="text-[11px] text-[#5c5344]">
          Annotated DOCX and PDF exports need a completed audit. Run the audit first.
        </p>
      )}
    </div>
  );
};

export default DocumentExportSuite;
