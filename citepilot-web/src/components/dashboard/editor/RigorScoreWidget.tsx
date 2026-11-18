"use client";

import React from "react";
import type { FindingsSummary } from "@/lib/editor/types";
import type { AuditSummary } from "@/lib/auditState";
import {
  CheckCircle2,
  ListChecks,
  Loader2,
  AlertOctagon,
  AlertTriangle,
  CircleDashed,
} from "lucide-react";

export interface FindingsSummaryWidgetProps {
  summary: FindingsSummary;
  audit: AuditSummary;
  className?: string;
}

const CATEGORY_ROWS: {
  key: keyof FindingsSummary["byCategory"];
  label: string;
  check: string;
}[] = [
  { key: "citation", label: "Citations", check: "citations" },
  { key: "style", label: "Style", check: "style" },
  { key: "claim", label: "Uncited claims", check: "uncited_claims" },
  { key: "reference", label: "References", check: "references" },
];

const TONE_STYLES: Record<
  AuditSummary["tone"],
  { wrapper: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  neutral: { wrapper: "bg-[#faf6ec]", icon: "text-[#5c5344]", Icon: CircleDashed },
  info: { wrapper: "bg-[#e7e9f5]", icon: "text-[#2c3e8c]", Icon: Loader2 },
  success: { wrapper: "bg-[#dee8dd]", icon: "text-[#3b6647]", Icon: CheckCircle2 },
  warning: { wrapper: "bg-[#f1e4c8]", icon: "text-[#7a530c]", Icon: AlertTriangle },
  error: { wrapper: "bg-[#f3dcd6]", icon: "text-[#a32b21]", Icon: AlertOctagon },
};

/**
 * Reports what the audit actually found, and — critically — whether an audit
 * produced these numbers at all. "Nothing flagged" is reserved for a current,
 * fully completed audit with zero findings.
 */
export const FindingsSummaryWidget: React.FC<FindingsSummaryWidgetProps> = ({
  summary,
  audit,
  className = "",
}) => {
  const toneStyle = TONE_STYLES[audit.tone] || TONE_STYLES.neutral;
  const { Icon } = toneStyle;
  const hasFindings = summary.total > 0;
  const showCounts = audit.showsResult && hasFindings;
  const completedAudit =
    audit.phase === "completed" && audit.freshness === "current";
  const partial = audit.incompleteChecks.length > 0;
  const clean = completedAudit && audit.isClean && !hasFindings;
  const unavailableChecks = new Set(
    audit.incompleteChecks.map((check) => check.name)
  );

  const headline = clean
    ? "Nothing flagged"
    : completedAudit
      ? hasFindings
        ? `${summary.active} open ${summary.active === 1 ? "finding" : "findings"}${partial ? " so far" : ""}`
        : audit.headline
      : audit.headline;

  const description = clean
    ? "This completed audit found no citation or reference problems."
    : completedAudit
      ? hasFindings
        ? `${summary.total} detected by completed checks${
            summary.resolved > 0 ? ` · ${summary.resolved} resolved` : ""
          }${
            partial
              ? ` · ${audit.incompleteChecks.length} ${
                  audit.incompleteChecks.length === 1 ? "check" : "checks"
                } could not complete`
              : ""
          }`
        : audit.description
      : audit.description;

  return (
    <div
      data-testid="findings-summary"
      data-audit-phase={audit.phase}
      role="region"
      aria-label="Audit findings summary"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-5 shadow-none flex flex-col gap-4 transition-all ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-none ${toneStyle.wrapper}`}
        >
          <Icon
            className={`w-4 h-4 ${audit.tone === "info" ? "animate-spin motion-reduce:animate-none" : ""} ${toneStyle.icon}`}
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <h3
            className="text-sm font-bold text-[#221d16]"
            aria-live="polite"
            data-testid="findings-summary-headline"
          >
            {headline}
          </h3>
          <p className="text-xs text-[#5c5344] mt-0.5">{description}</p>
        </div>
      </div>

      {showCounts && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-[#d9cfb8]">
          {CATEGORY_ROWS.map((row) => {
            const notChecked = unavailableChecks.has(row.check);
            return (
              <div key={row.key} className="flex items-baseline justify-between gap-2">
                <dt className="text-xs text-[#5c5344]">{row.label}</dt>
                <dd className="text-xs font-bold text-[#221d16] tabular-nums">
                  {notChecked ? (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">not checked</span>
                    </>
                  ) : (
                    summary.byCategory[row.key]
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      {audit.incompleteChecks.length > 0 && (
        <div className="pt-3 border-t border-[#d9cfb8]">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7a530c]">
            Checks with incomplete coverage
          </h4>
          <ul className="mt-1.5 space-y-1.5">
            {audit.incompleteChecks.map((check) => (
              <li key={check.name} className="text-[11px] text-[#5c5344]">
                <span className="font-bold text-[#221d16]">{check.label}:</span>{" "}
                {check.message ||
                  (check.status === "skipped"
                    ? "Skipped for this audit."
                    : check.status === "partial"
                      ? "Some items in this check could not be verified."
                      : "Unavailable for this audit.")}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#7a530c] mt-2 font-semibold">
            Missing findings for these checks do not mean the document is clean.
          </p>
        </div>
      )}

      {showCounts && summary.active === 0 && (
        <p className="text-[11px] text-[#5c5344] flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
          All findings from this audit have been resolved or dismissed.
        </p>
      )}
    </div>
  );
};

export default FindingsSummaryWidget;
