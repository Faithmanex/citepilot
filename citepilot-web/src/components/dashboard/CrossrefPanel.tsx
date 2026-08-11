"use client";

import type { AuditResponse } from "@/lib/types";
import { CheckCircle2, AlertCircle, XCircle, ShieldCheck, ExternalLink } from "lucide-react";

interface CrossrefPanelProps {
  data: AuditResponse | null;
}

export default function CrossrefPanel({ data }: CrossrefPanelProps) {
  const refs = data?.references ?? [];
  const retracted = refs.filter((r) => r.status === "retracted");
  const withDiscrepancies = refs.filter(
    (r) => (r.crossref_validation?.discrepancies?.length ?? 0) > 0
  );
  const verified = refs.filter(
    (r) => r.crossref_validation?.crossref_verified && (r.crossref_validation?.discrepancies?.length ?? 0) === 0 && r.status !== "retracted"
  );

  return (
    <section className="space-y-5 animate-fade-in" id="panel-crossref">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">Crossref Verification</h1>
        <p className="text-xs text-[#696050]">
          Each reference entry is verified against Crossref metadata. Metadata discrepancies and retracted sources are flagged for your review.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Verified", count: verified.length, icon: CheckCircle2, color: "#1E5E4B", bg: "#DEE8DD" },
          { label: "Discrepancies", count: withDiscrepancies.length, icon: AlertCircle, color: "#825500", bg: "#F1E4C8" },
          { label: "Retracted", count: retracted.length, icon: XCircle, color: "#961E14", bg: "#F3DCD6" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-lg" style={{ backgroundColor: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <div className="font-mono text-2xl font-black" style={{ color }}>{count}</div>
            <div className="text-[11px] text-[#696050]">{label}</div>
          </div>
        ))}
      </div>

      {!data ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            Upload a manuscript and run an audit to see Crossref verification results.
          </div>
        </div>
      ) : retracted.length === 0 && withDiscrepancies.length === 0 ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            All references verified against Crossref. No retractions or discrepancies found.
          </div>
        </div>
      ) : (
        <>
          {/* Retracted */}
          {retracted.length > 0 && (
            <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
              <h2 className="text-xs font-bold text-[#961E14] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4" /> Retracted Sources ({retracted.length})
              </h2>
              <div className="space-y-2">
                {retracted.map((r, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F3DCD6] border border-[#961E14]/25 rounded-xl text-xs">
                    <div className="font-mono text-[#961E14] font-bold mb-1">RETRACTED</div>
                    <div className="text-[#353027] mb-2">{r.raw_entry}</div>
                    {r.retraction_info?.how_to_fix && (
                      <div className="text-[#825500] bg-[#F1E4C8] rounded-lg p-2 mt-1">
                        ↳ {r.retraction_info.how_to_fix}
                      </div>
                    )}
                    {r.parsed_doi && (
                      <a href={`https://doi.org/${r.parsed_doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1E3A8A] font-semibold mt-2 text-[11px]">
                        <ExternalLink className="w-3 h-3" /> View on Crossref
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discrepancies */}
          {withDiscrepancies.length > 0 && (
            <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
              <h2 className="text-xs font-bold text-[#825500] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" /> Metadata Discrepancies ({withDiscrepancies.length})
              </h2>
              <div className="space-y-3">
                {withDiscrepancies.map((r, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F1E4C8] border border-[#825500]/25 rounded-xl text-xs">
                    <div className="text-[#353027] font-mono mb-2">{r.raw_entry}</div>
                    <div className="space-y-1.5">
                      {(r.crossref_validation?.discrepancies ?? []).map((d, di) => (
                        <div key={di} className="flex gap-2">
                          <span className="font-bold text-[#825500] uppercase font-mono text-[10px]">{d.field ?? "Field"}</span>
                          <span className="text-[#353027]">{d.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
