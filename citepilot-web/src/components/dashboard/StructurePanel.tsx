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
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#0e101a] mb-1 font-display">
          Document Layout & Structure Audit
        </h1>
        <p className="text-xs text-[#545454]">
          Checks heading level hierarchy, title page layout, margins, font styles, and table of contents alignment.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs text-[#545454]">
            <FileSpreadsheet className="w-4 h-4 flex-none" />
            Upload a manuscript and run an audit to check document structure.
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg text-xs text-[#027e6f]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            Document layout & heading structure validated cleanly with no issues found.
          </div>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono mb-4">
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
                  className="flex gap-3 items-start p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs"
                >
                  {isErr ? (
                    <AlertCircle className="w-4 h-4 text-[#b91c1c] flex-none mt-0.5" />
                  ) : isWarn ? (
                    <AlertCircle className="w-4 h-4 text-[#b45309] flex-none mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#027e6f] flex-none mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-[#0e101a] mb-0.5">{title}</div>
                    {detail && <div className="text-[#545454] leading-relaxed">{detail}</div>}
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
