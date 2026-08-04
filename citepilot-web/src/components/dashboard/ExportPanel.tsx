"use client";

import { useState } from "react";
import { exportPdf, exportDocx } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";
import { FileDown, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface ExportPanelProps {
  data: AuditResponse | null;
  manuscriptText: string;
}

type ExportStatus = { type: "idle" | "loading" | "success" | "error"; message?: string };

export default function ExportPanel({ data, manuscriptText }: ExportPanelProps) {
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>({ type: "idle" });
  const [docxStatus, setDocxStatus] = useState<ExportStatus>({ type: "idle" });

  const resetStatus = (setter: (s: ExportStatus) => void) =>
    setTimeout(() => setter({ type: "idle" }), 4000);

  const handleExportPdf = async () => {
    if (!data) {
      setPdfStatus({ type: "error", message: "Run an audit first before downloading." });
      resetStatus(setPdfStatus);
      return;
    }
    setPdfStatus({ type: "loading" });
    try {
      const blob = await exportPdf(data);
      downloadBlob(blob, "citepilot_diagnostic_report.pdf");
      setPdfStatus({ type: "success", message: "PDF downloaded successfully." });
    } catch (err) {
      setPdfStatus({ type: "error", message: (err as Error).message });
    } finally {
      resetStatus(setPdfStatus);
    }
  };

  const handleExportDocx = async () => {
    if (!data) {
      setDocxStatus({ type: "error", message: "Run an audit first before downloading." });
      resetStatus(setDocxStatus);
      return;
    }
    setDocxStatus({ type: "loading" });
    const textPayload = manuscriptText || (data.text ?? data.manuscript_text ?? "Uploaded Document");
    try {
      const blob = await exportDocx(textPayload, data);
      downloadBlob(blob, "citepilot_redline_manuscript.docx");
      setDocxStatus({ type: "success", message: "DOCX downloaded successfully." });
    } catch (err) {
      setDocxStatus({ type: "error", message: (err as Error).message });
    } finally {
      resetStatus(setDocxStatus);
    }
  };

  const StatusBadge = ({ status }: { status: ExportStatus }) => {
    if (status.type === "idle") return null;
    const isError = status.type === "error";
    const isSuccess = status.type === "success";
    return (
      <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg ${isError ? "bg-[#F3DCD6] text-[#961E14]" : isSuccess ? "bg-[#DEE8DD] text-[#1E5E4B]" : "bg-[#F1E4C8] text-[#825500]"}`}>
        {isError ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        {status.message ?? (status.type === "loading" ? "Generating…" : "")}
      </div>
    );
  };

  const exportButtons = [
    {
      id: "pdf",
      label: "Download Diagnostic Report",
      sub: "Complete audit summary & Crossref discrepancies",
      icon: FileText,
      tag: "PDF",
      status: pdfStatus,
      handler: handleExportPdf,
    },
    {
      id: "docx",
      label: "Download Redline DOCX",
      sub: "Formatted manuscript with Word Tracked Changes",
      icon: FileDown,
      tag: "DOC",
      status: docxStatus,
      handler: handleExportDocx,
    },
  ];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-export">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">Export Options</h1>
        <p className="text-xs text-[#696050] mb-5">
          Download diagnostic reports and formatted redline manuscripts.
        </p>

        {!data && (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1E4C8] border border-[#825500]/25 rounded-xl text-xs text-[#825500] mb-4">
            <AlertCircle className="w-4 h-4 flex-none" />
            Run an audit first to enable export options.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3.5">
          {exportButtons.map(({ id, label, sub, icon: Icon, tag, status, handler }) => (
            <div key={id} className="flex-1">
              <button
                className={`flex items-center gap-3 border border-[#C7BC9F] bg-[#FAF6EC] hover:bg-[#F1EBDC] rounded-xl py-4 px-5 cursor-pointer w-full min-h-[44px] text-left transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${status.type === "loading" ? "opacity-60 pointer-events-none" : ""}`}
                onClick={handler}
                disabled={status.type === "loading"}
                aria-label={label}
              >
                <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center font-extrabold text-xs flex-none">
                  {status.type === "loading" ? (
                    <Icon className="w-4 h-4 animate-pulse" />
                  ) : (
                    tag
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-[#221D16] mb-0.5">
                    {status.type === "loading" ? `Generating ${tag}…` : label}
                  </div>
                  <div className="text-[12px] text-[#696050]">{sub}</div>
                </div>
              </button>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
