"use client";

import type { AuditResponse } from "@/lib/types";
import { SearchX, Link2Off, Shuffle, CalendarX2, ShieldCheck, AlertTriangle } from "lucide-react";

interface MatchingPanelProps {
  data: AuditResponse | null;
}

export default function MatchingPanel({ data }: MatchingPanelProps) {
  const citations = data?.citations ?? [];
  const refs = data?.references ?? [];
  const missingRefs = citations.filter((c) => c.status === "no_match").length;
  const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
  const spellingMismatches = citations.filter((c) =>
    (c.issues ?? []).some((i) => i.type === "spelling_mismatch" || i.code === "SPELLING_MISMATCH" || c.match_type === "fuzzy")
  ).length;
  const yearMismatches = citations.filter((c) =>
    (c.issues ?? []).some((i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH")
  ).length;

  const summaryCards = [
    { label: "Missing References", value: missingRefs, sub: "Cited but no entry found", icon: SearchX, color: "#961E14", bg: "#F3DCD6" },
    { label: "Uncited References", value: uncitedRefs, sub: "In bibliography, never cited", icon: Link2Off, color: "#825500", bg: "#F1E4C8" },
    { label: "Author Name Discrepancies", value: spellingMismatches, sub: "Capitalisation or initials differ", icon: Shuffle, color: "#1E3A8A", bg: "#DBEAFE" },
    { label: "Year Mismatches", value: yearMismatches, sub: "Year differs from the reference list entry", icon: CalendarX2, color: "#6D28D9", bg: "#EDE9FE" },
  ];

  const allCitations = citations.filter(
    (c) =>
      c.status === "no_match" ||
      (c.issues ?? []).some((i) => i.type === "spelling_mismatch" || i.code === "SPELLING_MISMATCH" || c.match_type === "fuzzy") ||
      (c.issues ?? []).some((i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH")
  );

  return (
    <section className="space-y-5 animate-fade-in" id="panel-matching">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">Citation & Reference Matching</h1>
        <p className="text-xs text-[#696050]">
          Bidirectional matching between in-text citations and reference list entries, with author name and year discrepancy detection.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#353027]">{label}</span>
              <span className="p-1 rounded-lg" style={{ backgroundColor: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
            </div>
            <div className="font-mono text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-[11px] text-[#696050] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#825500]" /> Flagged Citations
        </h2>

        {!data ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            Upload a manuscript and run an audit to see citation matching results.
          </div>
        ) : allCitations.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            All citations matched correctly — no discrepancies found.
          </div>
        ) : (
          <div className="space-y-2">
            {allCitations.map((c, idx) => (
              <div key={idx} className="p-3.5 bg-[#F3DCD6] border border-[#961E14]/25 rounded-xl text-xs text-[#961E14] font-mono">
                <div className="font-bold mb-0.5">¶{(c.paragraph_index ?? 0) + 1} — {c.status === "no_match" ? "No Match" : "Discrepancy"}</div>
                <div className="text-[#353027]">{c.raw_text}</div>
                {(c.issues ?? []).map((issue, ii) => (
                  <div key={ii} className="mt-1 text-[#825500]">{issue.message}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orphaned references */}
      {data && uncitedRefs > 0 && (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <Link2Off className="w-4 h-4 text-[#825500]" /> Orphaned References
          </h2>
          <div className="space-y-2">
            {refs
              .filter((r) => r.status === "orphaned")
              .map((r, idx) => (
                <div key={idx} className="p-3.5 bg-[#F1E4C8] border border-[#825500]/25 rounded-xl text-xs text-[#825500] font-mono">
                  {r.raw_entry}
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
