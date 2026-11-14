"use client";

import type { AuditResponse } from "@/lib/types";
import type { AuditSummary } from "@/lib/auditState";
import { DocumentExportSuite } from "./editor/DocumentExportSuite";

interface ExportPanelProps {
  data: AuditResponse | null;
  audit: AuditSummary;
  manuscriptText: string;
  documentName: string;
}

/**
 * The dedicated export panel and the editor's export suite share one
 * implementation so availability, copy, and behaviour cannot drift apart.
 */
export default function ExportPanel({
  data,
  audit,
  manuscriptText,
  documentName,
}: ExportPanelProps) {
  return (
    <section className="space-y-5" id="panel-export" aria-labelledby="export-panel-heading">
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
        <h2
          id="export-panel-heading"
          className="text-base font-extrabold text-[#221d16] mb-1 font-display"
        >
          Export
        </h2>
        <p className="text-xs text-[#5c5344] mb-5">
          Download the current manuscript as-is, or export files that carry audit
          evidence.
        </p>

        <DocumentExportSuite
          data={data}
          audit={audit}
          manuscriptText={manuscriptText}
          documentName={documentName}
        />
      </div>
    </section>
  );
}
