"use client";

import type { AuditResponse } from "@/lib/types";

interface OverviewPanelProps {
  data: AuditResponse | null;
  mode: string;
}

export default function OverviewPanel({ data, mode }: OverviewPanelProps) {
  const citations = data?.citations ?? [];
  const refs = data?.references ?? [];
  const warnings = data?.style_warnings ?? [];
  const claims = data?.uncited_claims ?? [];
  const recency = data?.recency ?? {};

  const missingRefs = citations.filter((c) => c.status === "no_match").length;
  const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
  const retractedCount = refs.filter((r) => r.status === "retracted").length;
  const crDiscrepancies = refs.reduce(
    (acc, r) => acc + (r.crossref_validation?.discrepancies?.length ?? 0),
    0
  );
  const issueCount =
    warnings.length + retractedCount + missingRefs + crDiscrepancies;
  const matchedCount = citations.filter((c) => c.status === "matched").length;
  const matchRate = citations.length
    ? Math.round((matchedCount / citations.length) * 100)
    : 100;
  const recencyStatus = (
    recency.recency_compliance_status ?? "N/A"
  ).toUpperCase();

  const isRefOnly = mode === "reference_only";
  const subtitle = data
    ? `Audit completed. Analyzed ${citations.length} citations and ${refs.length} reference entries.`
    : isRefOnly
      ? "Reference-List-Only Audit mode active. Run an audit above to analyze bibliography entries."
      : "Full Manuscript Audit mode active. Run an audit above to generate real-time citation analysis.";
  const title = isRefOnly
    ? "Reference-List-Only Audit Report"
    : "Full Manuscript Audit Report";

  const priorityItems: string[] = [];

  refs
    .filter((r) => r.status === "retracted")
    .forEach((r) => {
      priorityItems.push(`RETRACTED SOURCE DETECTED — ${(r.raw_entry ?? "").substring(0, 90)}...`);
    });
  citations
    .filter((c) => c.status === "no_match")
    .forEach((c) => {
      priorityItems.push(`MISSING REFERENCE — '${c.raw_text}' (Paragraph ${(c.paragraph_index ?? 0) + 1})`);
    });
  refs.forEach((r) => {
    (r.crossref_validation?.discrepancies ?? []).forEach((d) => {
      priorityItems.push(`CROSSREF DISCREPANCY (${(d.field ?? "").toUpperCase()}) — ${d.message ?? ""}`);
    });
  });
  warnings.slice(0, 5).forEach((w) => {
    priorityItems.push(`${w.code ?? "STYLE WARNING"} — ${w.message ?? ""}`);
  });

  return (
    <section className="panel active" id="panel-overview">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">{title}</h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Citations parsed
          </div>
          <div className="font-mono text-[28px] font-bold">{citations.length}</div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            across body sections
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Issues flagged
          </div>
          <div className="font-mono text-[28px] font-bold text-error">
            {issueCount}
          </div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            retractions & mismatches
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Bidirectional match rate
          </div>
          <div className="font-mono text-[28px] font-bold text-verified">
            {matchRate}%
          </div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            citations linked
          </div>
        </div>
        <div className="bg-card border-2 border-line rounded-md p-[18px_18px_16px]">
          <div className="text-[12.5px] font-bold text-dash-ink-faint mb-2">
            Recency status
          </div>
          <div className="font-mono text-[28px] font-bold text-warning">
            {recencyStatus}
          </div>
          <div className="text-xs font-semibold text-dash-ink-faint mt-1.5">
            last 5 years ratio
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card border-2 border-line rounded-md p-5 w-full">
          <h2 className="text-[15px] font-extrabold m-0 mb-1">
            Highest-priority findings
          </h2>
          <p className="text-[13px] text-dash-ink-faint m-0 mb-4">
            Pulled from Crossref validation, matching, and retraction checks.
          </p>
          {priorityItems.length === 0 ? (
            <ul className="list-none m-0 p-0">
              <li className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]">
                <span className="status-icon status-icon-ok">✓</span>
                <div>
                  <div className="font-bold mb-0.5" style={{ color: "var(--color-verified)" }}>
                    No document audited yet
                  </div>
                  <div className="text-[13px] text-dash-ink-soft leading-[1.5]">
                    Upload a document or paste text above and click &apos;Run
                    audit&apos;.
                  </div>
                </div>
              </li>
            </ul>
          ) : (
            <ul className="list-none m-0 p-0">
              {priorityItems.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]"
                >
                  <span className="status-icon status-icon-err">!</span>
                  <div>
                    <div className="li-title font-bold mb-0.5">{item}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
