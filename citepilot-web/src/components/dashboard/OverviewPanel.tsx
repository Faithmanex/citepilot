"use client";

import type { AuditResponse } from "@/lib/types";
import {
  ShieldAlert,
  ShieldCheck,
  SearchX,
  Link2Off,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";

interface OverviewPanelProps {
  data: AuditResponse | null;
  mode: string;
}

export default function OverviewPanel({ data, mode }: OverviewPanelProps) {
  const citations = data?.citations ?? [];
  const refs = data?.references ?? [];
  const warnings = data?.style_warnings ?? [];
  const claims = data?.uncited_claims ?? [];

  const missingRefs = citations.filter((c) => c.status === "no_match").length;
  const uncitedRefs = refs.filter((r) => r.status === "orphaned").length;
  const retractedCount = refs.filter((r) => r.status === "retracted").length;
  const crDiscrepancies = refs.reduce(
    (acc, r) => acc + (r.crossref_validation?.discrepancies?.length ?? 0),
    0
  );
  const matchedCount = citations.filter((c) => c.status === "matched").length;
  const matchRate = citations.length
    ? Math.round((matchedCount / citations.length) * 100)
    : 100;

  const totalDeductions =
    missingRefs * 12 +
    uncitedRefs * 8 +
    retractedCount * 25 +
    crDiscrepancies * 5 +
    warnings.length * 3 +
    claims.length * 5;
  const integrityScore = data
    ? Math.max(0, Math.min(100, 100 - totalDeductions))
    : 96;

  const isRefOnly = mode === "reference_only";

  const scoreColor =
    integrityScore >= 80
      ? "#1E5E4B"
      : integrityScore >= 60
      ? "#825500"
      : "#961E14";
  const scoreBg =
    integrityScore >= 80
      ? "#DEE8DD"
      : integrityScore >= 60
      ? "#F1E4C8"
      : "#F3DCD6";

  // Build priority items
  const priorityItems: { label: string; type: "error" | "warn" | "info" }[] = [];
  refs
    .filter((r) => r.status === "retracted")
    .forEach((r) =>
      priorityItems.push({
        label: `Retracted — ${(r.raw_entry ?? "").substring(0, 80)}…`,
        type: "error",
      })
    );
  citations
    .filter((c) => c.status === "no_match")
    .forEach((c) =>
      priorityItems.push({
        label: `Unmatched citation — "${c.raw_text}" (¶${(c.paragraph_index ?? 0) + 1})`,
        type: "error",
      })
    );
  refs.forEach((r) =>
    (r.crossref_validation?.discrepancies ?? []).forEach((d) =>
      priorityItems.push({
        label: `Crossref discrepancy (${(d.field ?? "").toUpperCase()}) — ${d.message ?? ""}`,
        type: "warn",
      })
    )
  );
  warnings.slice(0, 3).forEach((w) =>
    priorityItems.push({ label: `Style alert — ${w.message ?? ""}`, type: "warn" })
  );

  const summaryCards = [
    {
      label: "Ghost Citations",
      value: missingRefs,
      sub: "Unmatched in text",
      icon: SearchX,
      color: "#961E14",
      bg: "#F3DCD6",
    },
    {
      label: "Uncited Refs",
      value: uncitedRefs,
      sub: "Orphaned in bibliography",
      icon: Link2Off,
      color: "#825500",
      bg: "#F1E4C8",
    },
    {
      label: "Crossref Issues",
      value: crDiscrepancies + retractedCount,
      sub: "Discrepancies & retractions",
      icon: FileQuestion,
      color: "#1E3A8A",
      bg: "#DBEAFE",
    },
    {
      label: "Match Rate",
      value: `${matchRate}%`,
      sub: "Linked to bibliography",
      icon: CheckCircle2,
      color: "#1E5E4B",
      bg: "#DEE8DD",
    },
  ];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-overview">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-base font-extrabold text-[#221D16] font-dash">
            {isRefOnly ? "Reference List Audit" : "Manuscript Audit Summary"}
          </h1>
          <p className="text-xs text-[#696050] mt-1">
            {data
              ? `Verified ${citations.length} citations against ${refs.length} reference entries.`
              : "Upload or paste your manuscript above, then click 'Run Audit'."}
          </p>
        </div>

        {/* Integrity Score */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ backgroundColor: scoreBg, borderColor: scoreColor + "40" }}
        >
          <div
            className="font-mono text-3xl font-black"
            style={{ color: scoreColor }}
          >
            {integrityScore}
            <span className="text-sm font-normal text-[#696050]">/100</span>
          </div>
          <div
            className="text-[11px] font-bold uppercase tracking-wider font-mono border-l pl-3"
            style={{ color: scoreColor, borderColor: scoreColor + "30" }}
          >
            Integrity
            <br />
            Score
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#353027]">{label}</span>
              <span
                className="p-1 rounded-lg"
                style={{ backgroundColor: bg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
            </div>
            <div
              className="font-mono text-2xl font-black"
              style={{ color }}
            >
              {value}
            </div>
            <div className="text-[11px] text-[#696050] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Priority Findings */}
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#825500]" />
          Key Issues & Alerts
        </h2>

        {priorityItems.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#DEE8DD]/60 border border-[#1E5E4B]/20 rounded-xl text-xs text-[#1E5E4B]">
            <ShieldCheck className="w-4 h-4 flex-none" />
            <span>
              {data
                ? "All citations matched correctly — no critical errors found."
                : "No issues detected yet. Click 'Run Audit' above to begin."}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {priorityItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs font-mono border ${
                  item.type === "error"
                    ? "bg-[#F3DCD6] border-[#961E14]/25 text-[#961E14]"
                    : "bg-[#F1E4C8] border-[#825500]/25 text-[#825500]"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
