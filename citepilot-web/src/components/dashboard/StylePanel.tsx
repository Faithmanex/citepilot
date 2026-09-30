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
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#221d16] mb-1 font-display">Style Rule Violations</h1>
        <p className="text-xs text-[#5c5344]">
          Formatting violations, missing elements, and citation construction issues detected against the selected style guide.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg text-xs text-[#5c5344]">
            <BookOpenCheck className="w-4 h-4 flex-none" />
            Select a citation style and run an audit to check for style violations.
          </div>
        </div>
      ) : warnings.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e7e9f5] border border-[#c9cee8] rounded-lg text-xs text-[#2c3e8c]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No style violations detected. Your citations conform to the selected style guide.
          </div>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <h2 className="text-xs font-bold text-[#14181f] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#93650f]" /> {warnings.length} Violation{warnings.length !== 1 ? "s" : ""} Found
          </h2>
          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <div key={idx} className="border border-[#d9cfb8] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#faf6ec] border-b border-[#d9cfb8]">
                  <span className="font-mono text-[10px] font-bold text-[#14181f] tracking-wider uppercase">{w.code ?? `STYLE-${idx + 1}`}</span>
                </div>
                <div className="px-4 py-3.5 bg-[#ffffff] space-y-2">
                  <p className="text-sm font-semibold text-[#221d16]">{w.message}</p>
                  {w.target_text && (
                    <div className="text-xs text-[#5c5344] italic border-l-2 border-[#2c3e8c] pl-3">
                      &ldquo;{w.target_text}&rdquo;
                    </div>
                  )}
                  {w.suggestion && (
                    <div className="text-xs text-[#2c3e8c] bg-[#e7e9f5] border border-[#c9cee8] rounded-lg px-3 py-2 font-medium">
                      ✓ {w.suggestion}
                    </div>
                  )}
                  {w.educational_context && (
                    <p className="text-xs text-[#948a76] leading-relaxed">{w.educational_context}</p>
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
