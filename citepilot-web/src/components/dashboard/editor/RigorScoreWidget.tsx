"use client";

import React from "react";
import type { FindingsSummary } from "@/lib/editor/types";
import { CheckCircle2, ListChecks } from "lucide-react";

export interface FindingsSummaryWidgetProps {
  summary: FindingsSummary;
  className?: string;
}

const CATEGORY_ROWS: { key: keyof FindingsSummary["byCategory"]; label: string }[] = [
  { key: "citation", label: "Citations" },
  { key: "style", label: "Style" },
  { key: "claim", label: "Uncited claims" },
  { key: "reference", label: "References" },
];

/**
 * Reports what the audit actually found. No composite score, no readiness
 * grade — just the counts, each of which maps to a specific finding below.
 */
export const FindingsSummaryWidget: React.FC<FindingsSummaryWidgetProps> = ({
  summary,
  className = "",
}) => {
  const hasFindings = summary.total > 0;

  return (
    <div
      data-testid="findings-summary"
      role="region"
      aria-label="Audit findings summary"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-5 shadow-none flex flex-col gap-4 transition-all ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-none ${
            hasFindings ? "bg-[#f1e4c8]" : "bg-[#e7e9f5]"
          }`}
        >
          {hasFindings ? (
            <ListChecks className="w-4 h-4 text-[#93650f]" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#2c3e8c]" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#221d16]">
            {hasFindings
              ? `${summary.active} open ${summary.active === 1 ? "finding" : "findings"}`
              : "Nothing flagged"}
          </h3>
          <p className="text-xs text-[#5c5344] mt-0.5">
            {hasFindings
              ? `${summary.total} total detected${
                  summary.resolved > 0 ? ` · ${summary.resolved} resolved` : ""
                }`
              : "This run found no citation or reference problems."}
          </p>
        </div>
      </div>

      {hasFindings && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-[#d9cfb8]">
          {CATEGORY_ROWS.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-2">
              <dt className="text-xs text-[#5c5344]">{row.label}</dt>
              <dd className="text-xs font-bold text-[#221d16] tabular-nums">
                {summary.byCategory[row.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default FindingsSummaryWidget;
