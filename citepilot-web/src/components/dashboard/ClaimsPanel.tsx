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
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">
          AI Uncited Factual Claims
        </h1>
        <p className="text-xs text-[#696050]">
          Factual, empirical, or statistical assertions in the body text that lack a citation marker.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            <AlertTriangle className="w-4 h-4 flex-none text-[#825500]" />
            Upload a manuscript and run an audit to check for uncited factual claims.
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            No uncited factual claims detected.
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#825500]" /> {claims.length} Uncited Assertion{claims.length !== 1 ? "s" : ""}
          </h2>
          {claims.map((c, i) => (
            <div
              key={i}
              className="border border-[#C7BC9F] bg-[#FAF6EC] rounded-xl p-4 shadow-sm space-y-2"
            >
              <div className="text-sm italic font-semibold text-[#221D16] leading-relaxed">
                &ldquo;{c.claim_text ?? ""}&rdquo;
              </div>
              <div className="flex gap-3 font-mono text-[11px] font-bold text-[#696050]">
                <span>PARAGRAPH {(c.paragraph_index ?? 0) + 1}</span>
                <span className="text-[#961E14]">UNAUTHORED ASSERTION</span>
              </div>
              {c.educational_context && (
                <div className="text-xs text-[#696050] leading-relaxed pt-2 border-t border-dashed border-[#C7BC9F]">
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
