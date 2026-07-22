"use client";

import type { AuditResponse } from "@/lib/types";

interface MatchingPanelProps {
  data: AuditResponse | null;
}

export default function MatchingPanel({ data }: MatchingPanelProps) {
  const citations = data?.citations ?? [];
  const refs = data?.references ?? [];
  const missingRefs = citations.filter((c) => c.status === "no_match").length;
  const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
  const spellingMismatches = citations.filter((c) =>
    (c.issues ?? []).some(
      (i) =>
        i.type === "spelling_mismatch" ||
        i.code === "SPELLING_MISMATCH" ||
        c.match_type === "fuzzy"
    )
  ).length;
  const yearMismatches = citations.filter((c) =>
    (c.issues ?? []).some(
      (i) => i.type === "year_mismatch" || i.code === "YEAR_MISMATCH"
    )
  ).length;

  return (
    <section className="panel" id="panel-matching">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Citation & reference matching
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Bidirectional matching between in-text citations and reference list
          entries, with author spelling and year discrepancy detection.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Missing references
          </div>
          <div className="font-mono text-[28px] font-bold text-error">
            {missingRefs}
          </div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            cited, no entry found
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Uncited references
          </div>
          <div className="font-mono text-[28px] font-bold text-warning">
            {uncitedRefs}
          </div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            listed, never cited
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Author spelling mismatches
          </div>
          <div className="font-mono text-[28px] font-bold text-warning">
            {spellingMismatches}
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Year mismatches
          </div>
          <div className="font-mono text-[28px] font-bold text-warning">
            {yearMismatches}
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-line rounded-md p-5">
        <h2 className="text-[15px] font-extrabold m-0 mb-4">Match table</h2>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                In-text citation
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Reference match
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Issue / Status
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {citations.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-dash-ink-faint py-3 border-b border-line"
                >
                  No citation matches available yet.
                </td>
              </tr>
            ) : (
              citations.map((c, i) => {
                const hasValidRefIndex =
                  c.matched_reference_index !== null &&
                  c.matched_reference_index !== undefined &&
                  refs[c.matched_reference_index] &&
                  refs[c.matched_reference_index].raw_entry;
                const matchText = hasValidRefIndex
                  ? refs[c.matched_reference_index!].raw_entry.substring(0, 60) +
                    "..."
                  : "No match found";
                const isMatched = c.status === "matched";
                return (
                  <tr key={i}>
                    <td className="font-mono text-[13px] font-semibold text-dash-ink-soft py-3 px-2.5 border-b border-line">
                      {c.raw_text ?? ""}
                    </td>
                    <td className="py-3 px-2.5 border-b border-line">
                      {matchText}
                    </td>
                    <td className="py-3 px-2.5 border-b border-line">
                      <span
                        className={`pill ${isMatched ? "pill-ok" : "pill-err"}`}
                      >
                        {isMatched ? "Matched" : "Missing reference"}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 border-b border-line">
                      <button
                        className="link-btn"
                        data-label={c.raw_text ?? "citation"}
                        onClick={() =>
                          alert("Flagged citation: " + (c.raw_text ?? ""))
                        }
                      >
                        Flag
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
