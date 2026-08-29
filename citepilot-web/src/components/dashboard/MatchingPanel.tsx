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
    { label: "Missing References", value: missingRefs, sub: "Cited but no entry found", icon: SearchX, color: "#b91c1c", bg: "#fee2e2" },
    { label: "Uncited References", value: uncitedRefs, sub: "In bibliography, never cited", icon: Link2Off, color: "#b45309", bg: "#fef3c7" },
    { label: "Author Name Discrepancies", value: spellingMismatches, sub: "Capitalisation or initials differ", icon: Shuffle, color: "#2563eb", bg: "#eff6ff" },
    { label: "Year Mismatches", value: yearMismatches, sub: "Year differs from reference entry", icon: CalendarX2, color: "#5b21b6", bg: "#ede9fe" },
  ];

  const allCitations = citations.filter(
    (c) =>
      c.status === "no_match" ||
      (c.issues ?? []).some((i) => i.type === "spelling_mismatch" || i.code === "SPELLING_MISMATCH" || c.match_type === "fuzzy") ||
      (c.issues ?? []).some((i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH")
  );

  return (
    <section className="space-y-5 animate-fade-in" id="panel-matching">
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#0e101a] mb-1 font-display">Citation & Reference Matching</h1>
        <p className="text-xs text-[#545454]">
          Bidirectional matching between in-text citations and reference list entries, with author name and year discrepancy detection.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-4 shadow-none">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1f243c]">{label}</span>
              <span className="p-1 rounded-lg" style={{ backgroundColor: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
            </div>
            <div className="font-mono text-2xl font-black text-[#0e101a]">{value}</div>
            <div className="text-[11px] text-[#707070] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#b45309]" /> Flagged Citations
        </h2>

        {!data ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs text-[#545454]">
            Upload a manuscript and run an audit to see citation matching results.
          </div>
        ) : allCitations.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg text-xs text-[#027e6f]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            All citations matched correctly — no discrepancies found.
          </div>
        ) : (
          <div className="space-y-2">
            {allCitations.map((c, idx) => (
              <div key={idx} className="p-3.5 bg-[#fee2e2] border border-[#fca5a5] rounded-lg text-xs text-[#b91c1c] font-mono">
                <div className="font-bold mb-0.5">¶{(c.paragraph_index ?? 0) + 1} — {c.status === "no_match" ? "No Match" : "Discrepancy"}</div>
                <div className="text-[#1f243c]">{c.raw_text}</div>
                {(c.issues ?? []).map((issue, ii) => (
                  <div key={ii} className="mt-1 text-[#b45309]">{issue.message}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orphaned references */}
      {data && uncitedRefs > 0 && (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <Link2Off className="w-4 h-4 text-[#b45309]" /> Orphaned References
          </h2>
          <div className="space-y-2">
            {refs
              .filter((r) => r.status === "orphaned")
              .map((r, idx) => (
                <div key={idx} className="p-3.5 bg-[#fef3c7] border border-[#fde68a] rounded-lg text-xs text-[#b45309] font-mono">
                  {r.raw_entry}
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
