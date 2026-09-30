"use client";

import React, { useState } from "react";
import { exportPdf, exportDocx } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";
import {
  FileDown,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
} from "lucide-react";

export interface DocumentExportSuiteProps {
  data: AuditResponse | null;
  manuscriptText: string;
  documentName?: string;
  className?: string;
}

type ExportState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

export const DocumentExportSuite: React.FC<DocumentExportSuiteProps> = ({
  data,
  manuscriptText,
  documentName = "manuscript",
  className = "",
}) => {
  const [cleanDocxState, setCleanDocxState] = useState<ExportState>({ status: "idle" });
  const [redlineDocxState, setRedlineDocxState] = useState<ExportState>({ status: "idle" });
  const [pdfState, setPdfState] = useState<ExportState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const baseFileName = documentName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const resetState = (setter: React.Dispatch<React.SetStateAction<ExportState>>) => {
    setTimeout(() => setter({ status: "idle" }), 4000);
  };

  const handleDownloadCleanDocx = async () => {
    if (!manuscriptText.trim()) {
      setCleanDocxState({ status: "error", message: "No manuscript text to export." });
      resetState(setCleanDocxState);
      return;
    }
    setCleanDocxState({ status: "loading" });
    try {
      const blob = await exportDocx(manuscriptText, data, "clean");
      downloadBlob(blob, `${baseFileName}_revised_clean.docx`);
      setCleanDocxState({ status: "success", message: "Clean DOCX downloaded!" });
    } catch (err) {
      setCleanDocxState({ status: "error", message: (err as Error).message });
    } finally {
      resetState(setCleanDocxState);
    }
  };

  const handleDownloadRedlineDocx = async () => {
    if (!data) {
      setRedlineDocxState({ status: "error", message: "Audit data required for redline export." });
      resetState(setRedlineDocxState);
      return;
    }
    setRedlineDocxState({ status: "loading" });
    try {
      const blob = await exportDocx(manuscriptText, data, "redline");
      downloadBlob(blob, `${baseFileName}_redline_annotated.docx`);
      setRedlineDocxState({ status: "success", message: "Redline DOCX downloaded!" });
    } catch (err) {
      setRedlineDocxState({ status: "error", message: (err as Error).message });
    } finally {
      resetState(setRedlineDocxState);
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) {
      setPdfState({ status: "error", message: "Run an audit first to generate report." });
      resetState(setPdfState);
      return;
    }
    setPdfState({ status: "loading" });
    try {
      const blob = await exportPdf(data);
      downloadBlob(blob, `${baseFileName}_audit_report.pdf`);
      setPdfState({ status: "success", message: "PDF report downloaded!" });
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = manuscriptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      data-testid="document-export-suite"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none space-y-4 ${className}`.trim()}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#14181f]">
            Academic Export Suite
          </h3>
          <p className="text-xs text-[#948a76] mt-0.5">
            Export revised manuscripts and diagnostic verification reports
          </p>
        </div>
        <button
          type="button"
          data-testid="copy-manuscript-btn"
          onClick={handleCopyCleanManuscript}
          className="text-xs font-bold px-3 py-1.5 rounded-md border border-[#d9cfb8] hover:border-[#2c3e8c] hover:text-[#2c3e8c] bg-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#2c3e8c]" />
              <span className="text-[#2c3e8c]">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Clean Manuscript</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Clean Revised Word Document */}
        <div className="border-2 border-[#2c3e8c]/40 hover:border-[#2c3e8c] bg-[#faf6ec] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#2c3e8c]/10 text-[#2c3e8c] border border-[#2c3e8c]/20">
                Recommended
              </span>
              <span className="text-[10px] font-mono font-bold text-[#948a76]">DOCX</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2c3e8c]" />
              Clean Revised Word Doc
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              Fully updated manuscript with all accepted fixes and clean academic typography.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-clean-docx-btn"
              onClick={handleDownloadCleanDocx}
              disabled={cleanDocxState.status === "loading"}
              className="w-full bg-[#2c3e8c] hover:bg-[#24357a] text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {cleanDocxState.status === "loading" ? "Generating..." : "Download Clean .docx"}
              </span>
            </button>
            {cleanDocxState.status !== "idle" && (
              <div
                className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 ${
                  cleanDocxState.status === "success" ? "text-[#2c3e8c]" : "text-[#a32b21]"
                }`}
              >
                {cleanDocxState.status === "success" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{cleanDocxState.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Redline Annotated Word Document */}
        <div className="border border-[#d9cfb8] hover:border-[#2c3e8c]/40 bg-[#ffffff] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#f1ebdc] text-[#5c5344]">
                Audit Mode
              </span>
              <span className="text-[10px] font-mono font-bold text-[#948a76]">DOCX</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-[#5c5344]" />
              Redline Annotated Word Doc
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              Word document containing tracked style annotations and highlight comments.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-redline-docx-btn"
              onClick={handleDownloadRedlineDocx}
              disabled={redlineDocxState.status === "loading"}
              className="w-full border border-[#d9cfb8] hover:bg-[#faf6ec] text-[#221d16] text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {redlineDocxState.status === "loading" ? "Generating..." : "Download Redline .docx"}
              </span>
            </button>
            {redlineDocxState.status !== "idle" && (
              <div
                className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 ${
                  redlineDocxState.status === "success" ? "text-[#2c3e8c]" : "text-[#a32b21]"
                }`}
              >
                {redlineDocxState.status === "success" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{redlineDocxState.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* PDF Diagnostic Certificate */}
        <div className="border border-[#d9cfb8] hover:border-[#2c3e8c]/40 bg-[#ffffff] rounded-lg p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#f1ebdc] text-[#5c5344]">
                Audit Report
              </span>
              <span className="text-[10px] font-mono font-bold text-[#948a76]">PDF</span>
            </div>
            <h4 className="text-xs font-bold text-[#221d16] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5c5344]" />
              PDF Verification Report
            </h4>
            <p className="text-[11px] text-[#5c5344] leading-normal">
              Complete diagnostic report with Crossref checks and retraction findings.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              data-testid="export-pdf-report-btn"
              onClick={handleDownloadPdf}
              disabled={pdfState.status === "loading"}
              className="w-full border border-[#d9cfb8] hover:bg-[#faf6ec] text-[#221d16] text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {pdfState.status === "loading" ? "Generating..." : "Download Report .pdf"}
              </span>
            </button>
            {pdfState.status !== "idle" && (
              <div
                className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 ${
                  pdfState.status === "success" ? "text-[#2c3e8c]" : "text-[#a32b21]"
                }`}
              >
                {pdfState.status === "success" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{pdfState.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentExportSuite;
