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
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#0e101a] mb-1 font-display">
          Uncited Factual Claims
        </h1>
        <p className="text-xs text-[#545454]">
          Factual, empirical, or statistical assertions in the body text that lack a citation marker.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs text-[#545454]">
            <AlertTriangle className="w-4 h-4 flex-none text-[#b45309]" />
            Upload a manuscript and run an audit to check for uncited factual claims.
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg text-xs text-[#027e6f]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No uncited factual claims detected.
          </div>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 space-y-3 shadow-none">
          <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#b45309]" /> {claims.length} Uncited Claim{claims.length !== 1 ? "s" : ""}
          </h2>
          {claims.map((c, i) => (
            <div
              key={i}
              className="border border-[#ebebeb] bg-[#ffffff] rounded-lg p-4 shadow-none space-y-2"
            >
              <div className="text-sm italic font-semibold text-[#0e101a] leading-relaxed">
                &ldquo;{c.claim_text ?? ""}&rdquo;
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-[#707070]">
                <span>PARAGRAPH {(c.paragraph_index ?? 0) + 1}</span>
                <span className="text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-[4px] border border-[#fca5a5]">UNCITED CLAIM</span>
              </div>
              {c.educational_context && (
                <div className="text-xs text-[#545454] leading-relaxed pt-2 border-t border-dashed border-[#ebebeb]">
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
