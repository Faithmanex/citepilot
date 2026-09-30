"use client";

import type { AuditResponse } from "@/lib/types";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface ClaimsPanelProps {
  data: AuditResponse | null;
}

export default function ClaimsPanel({ data }: ClaimsPanelProps) {
  const claims = data?.uncited_claims ?? [];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-claims">
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#221d16] mb-1 font-display">
          Uncited Factual Claims
        </h1>
        <p className="text-xs text-[#5c5344]">
          Factual, empirical, or statistical assertions in the body text that lack a citation marker.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg text-xs text-[#5c5344]">
            <AlertTriangle className="w-4 h-4 flex-none text-[#93650f]" />
            Upload a manuscript and run an audit to check for uncited factual claims.
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e7e9f5] border border-[#c9cee8] rounded-lg text-xs text-[#2c3e8c]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No uncited factual claims detected.
          </div>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 space-y-3 shadow-none">
          <h2 className="text-xs font-bold text-[#14181f] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#93650f]" /> {claims.length} Uncited Claim{claims.length !== 1 ? "s" : ""}
          </h2>
          {claims.map((c, i) => (
            <div
              key={i}
              className="border border-[#d9cfb8] bg-[#ffffff] rounded-lg p-4 shadow-none space-y-2"
            >
              <div className="text-sm italic font-semibold text-[#221d16] leading-relaxed">
                &ldquo;{c.claim_text ?? ""}&rdquo;
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-[#948a76]">
                <span>PARAGRAPH {(c.paragraph_index ?? 0) + 1}</span>
                <span className="text-[#a32b21] bg-[#f3dcd6] px-2 py-0.5 rounded-[4px] border border-[#ddb3aa]">UNCITED CLAIM</span>
              </div>
              {c.educational_context && (
                <div className="text-xs text-[#5c5344] leading-relaxed pt-2 border-t border-dashed border-[#d9cfb8]">
                  {c.educational_context}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
