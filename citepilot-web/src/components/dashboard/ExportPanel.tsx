"use client";

import { useState } from "react";
import { exportPdf, exportDocx } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";

interface ExportPanelProps {
  data: AuditResponse | null;
  manuscriptText: string;
}

export default function ExportPanel({ data, manuscriptText }: ExportPanelProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data) {
      alert("Please run an audit first before downloading PDF report.");
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await exportPdf(data);
      downloadBlob(blob, "citepilot_diagnostic_report.pdf");
    } catch (err) {
      alert("Error exporting PDF: " + (err as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (!data) {
      alert("Please run an audit first before downloading Redline DOCX.");
      return;
    }
    setDocxLoading(true);
    const textPayload =
      manuscriptText ||
      (data.text ?? data.manuscript_text ?? "Uploaded Document");
    try {
      const blob = await exportDocx(textPayload, data);
      downloadBlob(blob, "citepilot_redline_manuscript.docx");
    } catch (err) {
      alert("Error exporting DOCX: " + (err as Error).message);
    } finally {
      setDocxLoading(false);
    }
  };

  return (
    <section className="panel" id="panel-export">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Feedback & export options
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Download diagnostic reports and manage dismissed suggestion rules.
        </p>
      </div>

      <div className="bg-card border-2 border-line rounded-md p-4 sm:p-5">
        <h2 className="text-[15px] font-extrabold m-0 mb-4">
          Download reports
        </h2>
        <div className="flex flex-col sm:flex-row gap-3.5 mt-1.5">
          <button
            className="flex items-center gap-3 border-2 border-line bg-card rounded-lg py-4 px-5 cursor-pointer w-full sm:flex-1 min-w-0 sm:min-w-[240px] min-h-[44px] text-left transition-all duration-150 ease hover:border-dash-ink-soft hover:-translate-y-0.5"
            onClick={handleExportPdf}
            disabled={pdfLoading}
            aria-label="Download PDF Diagnostic Report"
          >
            <div className="w-[38px] h-[38px] rounded-lg bg-brand-bg text-brand flex items-center justify-center font-extrabold text-sm flex-none">
              {pdfLoading ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                "PDF"
              )}
            </div>
            <div>
              <div className="font-extrabold text-sm mb-0.5">
                {pdfLoading ? "Generating PDF..." : "Download Diagnostic Report"}
              </div>
              <div className="text-[12.5px] text-dash-ink-faint">
                {pdfLoading ? "Please wait" : "Complete audit summary & Crossref discrepancies"}
              </div>
            </div>
          </button>

          <button
            className="flex items-center gap-3 border-2 border-line bg-card rounded-lg py-4 px-5 cursor-pointer w-full sm:flex-1 min-w-0 sm:min-w-[240px] min-h-[44px] text-left transition-all duration-150 ease hover:border-dash-ink-soft hover:-translate-y-0.5"
            onClick={handleExportDocx}
            disabled={docxLoading}
            aria-label="Download Redline DOCX File"
          >
            <div className="w-[38px] h-[38px] rounded-lg bg-brand-bg text-brand flex items-center justify-center font-extrabold text-sm flex-none">
              {docxLoading ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                "DOC"
              )}
            </div>
            <div>
              <div className="font-extrabold text-sm mb-0.5">
                {docxLoading ? "Generating DOCX..." : "Download Redline DOCX"}
              </div>
              <div className="text-[12.5px] text-dash-ink-faint">
                {docxLoading
                  ? "Please wait"
                  : "Formatted manuscript with Word Tracked Changes"}
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
