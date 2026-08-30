"use client";

import React from "react";
import type { RigorMetrics } from "@/lib/editor/types";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface RigorScoreWidgetProps {
  metrics: RigorMetrics;
  className?: string;
}

export const RigorScoreWidget: React.FC<RigorScoreWidgetProps> = ({
  metrics,
  className = "",
}) => {
  const {
    overallScore,
    totalIssues,
    resolvedIssues,
    citationIntegrity,
    styleCompliance,
    claimVerification,
    referenceReliability,
  } = metrics;

  const getTierInfo = (score: number) => {
    if (score >= 85) {
      return {
        label: "Publication Ready",
        color: "text-[#027e6f]",
        bgColor: "bg-[#e6f4f2]",
        borderColor: "border-[#027e6f]/30",
        icon: CheckCircle2,
      };
    }
    if (score >= 60) {
      return {
        label: "Needs Revisions",
        color: "text-[#d97706]",
        bgColor: "bg-[#fffbeb]",
        borderColor: "border-[#f59e0b]/30",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Significant Deficits",
      color: "text-[#e11d48]",
      bgColor: "bg-[#fff1f2]",
      borderColor: "border-[#f43f5e]/30",
      icon: XCircle,
    };
  };

  const tier = getTierInfo(overallScore);
  const TierIcon = tier.icon;

  return (
    <div
      data-testid="rigor-score-widget"
      className={`bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none space-y-4 ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#027e6f]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1f243c]">
            Academic Rigor Score
          </h3>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${tier.bgColor} ${tier.color} ${tier.borderColor}`}
        >
          <TierIcon className="w-3 h-3" />
          {tier.label}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline justify-between pt-1 pb-2 border-b border-[#f0f0f0]">
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0e101a] font-sans">
            {overallScore}
            <span className="text-lg font-normal text-[#707070]">/100</span>
          </div>
          <p className="text-[11px] text-[#707070] mt-0.5">
            {resolvedIssues} of {totalIssues} issues resolved in this session
          </p>
        </div>

        {/* Mini progress ring or bar */}
        <div className="w-24 h-2 bg-[#f0f0f0] rounded-full overflow-hidden self-center">
          <div
            className="h-full bg-[#027e6f] transition-all duration-500 rounded-full"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Sub-Metrics Breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
        <div>
          <div className="flex justify-between text-[#707070] mb-1 text-[11px]">
            <span>Citations</span>
            <span className="font-mono font-bold text-[#0e101a]">{citationIntegrity}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8b5cf6] transition-all duration-300"
              style={{ width: `${citationIntegrity}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#707070] mb-1 text-[11px]">
            <span>Style Compliance</span>
            <span className="font-mono font-bold text-[#0e101a]">{styleCompliance}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f59e0b] transition-all duration-300"
              style={{ width: `${styleCompliance}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#707070] mb-1 text-[11px]">
            <span>Claim Validation</span>
            <span className="font-mono font-bold text-[#0e101a]">{claimVerification}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f43f5e] transition-all duration-300"
              style={{ width: `${claimVerification}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#707070] mb-1 text-[11px]">
            <span>References</span>
            <span className="font-mono font-bold text-[#0e101a]">{referenceReliability}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#027e6f] transition-all duration-300"
              style={{ width: `${referenceReliability}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RigorScoreWidget;
