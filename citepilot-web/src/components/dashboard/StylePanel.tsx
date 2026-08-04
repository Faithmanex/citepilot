"use client";

import type { AuditResponse } from "@/lib/types";
import { BookOpenCheck, ShieldCheck, AlertCircle } from "lucide-react";

interface StylePanelProps {
  data: AuditResponse | null;
}

export default function StylePanel({ data }: StylePanelProps) {
  const warnings = data?.style_warnings ?? [];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-style">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">Style Rule Violations</h1>
        <p className="text-xs text-[#696050]">
          Formatting violations, missing elements, and citation construction issues detected against the selected style guide.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            <BookOpenCheck className="w-4 h-4 flex-none" />
            Select a citation style and run an audit to check for style violations.
          </div>
        </div>
      ) : warnings.length === 0 ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No style violations detected. Your citations conform to the selected style guide.
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#825500]" /> {warnings.length} Violation{warnings.length !== 1 ? "s" : ""} Found
          </h2>
          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <div key={idx} className="border border-[#C7BC9F] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#F1EBDC]">
                  <span className="font-mono text-[10px] font-bold text-[#353027] tracking-wider uppercase">{w.code ?? `STYLE-${idx + 1}`}</span>
                </div>
                <div className="px-4 py-3.5 bg-[#FAF6EC] space-y-2">
                  <p className="text-sm font-semibold text-[#221D16]">{w.message}</p>
                  {w.target_text && (
                    <div className="text-xs text-[#696050] italic border-l-2 border-[#C7BC9F] pl-3">
                      &ldquo;{w.target_text}&rdquo;
                    </div>
                  )}
                  {w.suggestion && (
                    <div className="text-xs text-[#1E5E4B] bg-[#DEE8DD]/60 border border-[#1E5E4B]/15 rounded-lg px-3 py-2">
                      ✓ {w.suggestion}
                    </div>
                  )}
                  {w.educational_context && (
                    <p className="text-xs text-[#696050] leading-relaxed">{w.educational_context}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
