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
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#0e101a] mb-1 font-display">Style Rule Violations</h1>
        <p className="text-xs text-[#545454]">
          Formatting violations, missing elements, and citation construction issues detected against the selected style guide.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs text-[#545454]">
            <BookOpenCheck className="w-4 h-4 flex-none" />
            Select a citation style and run an audit to check for style violations.
          </div>
        </div>
      ) : warnings.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg text-xs text-[#027e6f]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No style violations detected. Your citations conform to the selected style guide.
          </div>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#b45309]" /> {warnings.length} Violation{warnings.length !== 1 ? "s" : ""} Found
          </h2>
          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <div key={idx} className="border border-[#ebebeb] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border-b border-[#ebebeb]">
                  <span className="font-mono text-[10px] font-bold text-[#1f243c] tracking-wider uppercase">{w.code ?? `STYLE-${idx + 1}`}</span>
                </div>
                <div className="px-4 py-3.5 bg-[#ffffff] space-y-2">
                  <p className="text-sm font-semibold text-[#0e101a]">{w.message}</p>
                  {w.target_text && (
                    <div className="text-xs text-[#545454] italic border-l-2 border-[#027e6f] pl-3">
                      &ldquo;{w.target_text}&rdquo;
                    </div>
                  )}
                  {w.suggestion && (
                    <div className="text-xs text-[#027e6f] bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg px-3 py-2 font-medium">
                      ✓ {w.suggestion}
                    </div>
                  )}
                  {w.educational_context && (
                    <p className="text-xs text-[#707070] leading-relaxed">{w.educational_context}</p>
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
