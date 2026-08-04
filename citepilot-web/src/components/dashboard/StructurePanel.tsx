"use client";

import type { AuditResponse } from "@/lib/types";
import { FileSpreadsheet, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

interface StructurePanelProps {
  data: AuditResponse | null;
}

export default function StructurePanel({ data }: StructurePanelProps) {
  const structureData =
    data?.structure ?? data?.layout_issues ?? data?.document_structure ?? [];

  const items =
    Array.isArray(structureData) && structureData.length > 0
      ? structureData
      : [];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-structure">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">
          Document Layout & Structure Audit
        </h1>
        <p className="text-xs text-[#696050]">
          Checks heading level hierarchy, title page layout, margins, font styles, and table of contents alignment.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            <FileSpreadsheet className="w-4 h-4 flex-none" />
            Upload a manuscript and run an audit to check document structure.
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            Document layout & heading structure validated cleanly with no issues found.
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono mb-4">
            Structure Checklist
          </h2>
          <div className="space-y-2">
            {items.map((item, i) => {
              const isErr =
                item.status === "error" ||
                item.status === "err" ||
                item.severity === "high";
              const isWarn =
                item.status === "warning" || item.status === "warn";

              const title = item.title ?? item.rule ?? item.category ?? "Layout Rule";
              const detail = item.description ?? item.message ?? item.sub ?? "";

              return (
                <div
                  key={i}
                  className="flex gap-3 items-start p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs"
                >
                  {isErr ? (
                    <AlertCircle className="w-4 h-4 text-[#961E14] flex-none mt-0.5" />
                  ) : isWarn ? (
                    <AlertCircle className="w-4 h-4 text-[#825500] flex-none mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#1E5E4B] flex-none mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-[#221D16] mb-0.5">{title}</div>
                    {detail && <div className="text-[#696050] leading-relaxed">{detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
