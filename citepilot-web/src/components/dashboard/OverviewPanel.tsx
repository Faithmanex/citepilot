"use client";

import type { AuditResponse } from "@/lib/types";
import { computeAuditStats, computeScore } from "@/lib/auditStats";
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

  const stats = computeAuditStats(data);
  const integrityScore = data ? computeScore(data) : null;

  const isRefOnly = mode === "reference_only";

  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06px
  const progressOffset =
    integrityScore !== null
      ? circumference - (circumference * Math.max(0, Math.min(100, integrityScore))) / 100
      : circumference;

  const isHighRigor = integrityScore !== null && integrityScore >= 80;

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
      label: "Missing References",
      value: stats.missingRefs,
      sub: "No reference list entry found",
      icon: SearchX,
      color: "#b91c1c",
      bg: "#fee2e2",
    },
    {
      label: "Uncited References",
      value: stats.uncitedRefs,
      sub: "Entries never cited in text",
      icon: Link2Off,
      color: "#b45309",
      bg: "#fef3c7",
    },
    {
      label: "Validation Issues",
      value: stats.crDiscrepancies + stats.retractedCount,
      sub: "Discrepancies & retractions",
      icon: FileQuestion,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Match Rate",
      value: data ? `${stats.matchRate}%` : "—",
      sub: "Linked to reference list",
      icon: CheckCircle2,
      color: "#027e6f",
      bg: "#e6f4f2",
    },
  ];

  return (
    <section className="space-y-5 animate-fade-in" id="panel-overview">
      {/* Header Banner with Circular SVG Gauge Scorecard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 sm:p-6 shadow-none">
        <div className="flex items-center gap-4">
          {/* 76px Circular SVG Gauge */}
          <div className="w-[76px] h-[76px] relative flex items-center justify-center flex-none">
            <svg className="w-[76px] h-[76px] -rotate-90" viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="stroke-[#ebebeb]"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="38"
                cy="38"
                r={radius}
                className={isHighRigor ? "stroke-[#027e6f]" : "stroke-[#1f243c]"}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 0.4s ease-out, stroke 0.4s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-dash font-bold text-lg sm:text-xl text-[#0e101a] tracking-tight">
                {integrityScore !== null ? `${integrityScore}%` : "—"}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#707070]">
                Consistency Score
              </span>
              {isHighRigor && (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[#e6f4f2] text-[#027e6f] font-mono font-bold text-[10px] inline-flex items-center gap-0.5">
                  Optimal
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0e101a] font-display">
              {isRefOnly ? "Reference List Audit" : "Manuscript Audit Summary"}
            </h1>
            <p className="text-xs text-[#545454] mt-0.5">
              {data
                ? `Verified ${citations.length} citations against ${refs.length} reference entries.`
                : "Upload or paste your manuscript above, then click 'Run Audit'."}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-4 shadow-none"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1f243c]">{label}</span>
              <span
                className="p-1 rounded-lg"
                style={{ backgroundColor: bg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
            </div>
            <div
              className="font-mono text-2xl font-black text-[#0e101a]"
            >
              {value}
            </div>
            <div className="text-[11px] text-[#707070] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Priority Findings */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 space-y-3 shadow-none">
        <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#b45309]" />
          Key Issues & Alerts
        </h2>

        {priorityItems.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#e6f4f2] border border-[#a7dcd4] rounded-lg text-xs text-[#027e6f]">
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
                className={`p-3 rounded-lg text-xs font-mono border ${
                  item.type === "error"
                    ? "bg-[#fee2e2] border-[#fca5a5] text-[#b91c1c]"
                    : "bg-[#fef3c7] border-[#fde68a] text-[#b45309]"
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
