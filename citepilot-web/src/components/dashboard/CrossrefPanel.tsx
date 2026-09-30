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
      <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#221d16] mb-1 font-display">Crossref Verification</h1>
        <p className="text-xs text-[#5c5344]">
          Each reference entry is verified against Crossref metadata. Metadata discrepancies and retracted sources are flagged for your review.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Verified", count: verified.length, icon: CheckCircle2, color: "#2c3e8c", bg: "#e7e9f5" },
          { label: "Discrepancies", count: withDiscrepancies.length, icon: AlertCircle, color: "#93650f", bg: "#f1e4c8" },
          { label: "Retracted", count: retracted.length, icon: XCircle, color: "#a32b21", bg: "#f3dcd6" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 shadow-none">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-lg" style={{ backgroundColor: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <div className="font-mono text-2xl font-black text-[#221d16]">{count}</div>
            <div className="text-[11px] text-[#948a76]">{label}</div>
          </div>
        ))}
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg text-xs text-[#5c5344]">
            Upload a manuscript and run an audit to see Crossref verification results.
          </div>
        </div>
      ) : retracted.length === 0 && withDiscrepancies.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e7e9f5] border border-[#c9cee8] rounded-lg text-xs text-[#2c3e8c]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            All references verified against Crossref. No retractions or discrepancies found.
          </div>
        </div>
      ) : (
        <>
          {/* Retracted */}
          {retracted.length > 0 && (
            <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
              <h2 className="text-xs font-bold text-[#a32b21] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4" /> Retracted Sources ({retracted.length})
              </h2>
              <div className="space-y-2">
                {retracted.map((r, idx) => (
                  <div key={idx} className="p-3.5 bg-[#f3dcd6] border border-[#ddb3aa] rounded-lg text-xs">
                    <div className="font-mono text-[#a32b21] font-bold mb-1">RETRACTED</div>
                    <div className="text-[#14181f] mb-2">{r.raw_entry}</div>
                    {r.retraction_info?.how_to_fix && (
                      <div className="text-[#93650f] bg-[#f1e4c8] border border-[#ecd9a8] rounded-lg p-2 mt-1">
                        ↳ {r.retraction_info.how_to_fix}
                      </div>
                    )}
                    {r.parsed_doi && (
                      <a href={`https://doi.org/${r.parsed_doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2c3e8c] font-semibold mt-2 text-[11px] hover:underline">
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
            <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none">
              <h2 className="text-xs font-bold text-[#93650f] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" /> Metadata Discrepancies ({withDiscrepancies.length})
              </h2>
              <div className="space-y-3">
                {withDiscrepancies.map((r, idx) => (
                  <div key={idx} className="p-3.5 bg-[#f1e4c8] border border-[#ecd9a8] rounded-lg text-xs">
                    <div className="text-[#14181f] font-mono mb-2">{r.raw_entry}</div>
                    <div className="space-y-1.5">
                      {(r.crossref_validation?.discrepancies ?? []).map((d, di) => (
                        <div key={di} className="flex gap-2">
                          <span className="font-bold text-[#93650f] uppercase font-mono text-[10px]">{d.field ?? "Field"}</span>
                          <span className="text-[#5c5344]">{d.message}</span>
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
