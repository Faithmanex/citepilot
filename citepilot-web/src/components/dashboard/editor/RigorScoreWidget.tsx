"use client";

import React from "react";
import type { RigorMetrics } from "@/lib/editor/types";

export interface RigorScoreWidgetProps {
  metrics: RigorMetrics;
  className?: string;
}

function getStatusLabel(score: number): string {
  if (score >= 95) return "Ready for Journal Submission";
  if (score >= 85) return "Strong Academic Rigor";
  if (score >= 75) return "Moderate Verification Needed";
  return "Needs Immediate Attention";
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
  } = metrics;

  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06px
  const clamped = Math.max(0, Math.min(100, overallScore));
  const progressOffset = circumference - (circumference * clamped) / 100;
  const isHighRigor = overallScore >= 85;
  const unresolved = Math.max(0, totalIssues - resolvedIssues);
  const statusLabel = getStatusLabel(overallScore);

  const tiles: { id: string; label: string; value: number; testid: string }[] = [
    { id: "coverage", label: "Coverage", value: citationIntegrity, testid: "metric-tile-coverage" },
    { id: "integrity", label: "Integrity", value: claimVerification, testid: "metric-tile-claim-integrity" },
    { id: "tone", label: "Tone", value: styleCompliance, testid: "metric-tile-scholarly-tone" },
  ];

  return (
    <div
      data-testid="rigor-score-widget"
      role="region"
      aria-label="Citation Rigor Scorecard"
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-5 shadow-none flex flex-col gap-3.5 transition-all ${className}`.trim()}
    >
      {/* Top Row: Circular Gauge + Status Headline */}
      <div className="flex items-center gap-4">
        <div className="w-[76px] h-[76px] relative flex items-center justify-center flex-none">
          <svg className="w-[76px] h-[76px] -rotate-90" viewBox="0 0 76 76">
            <circle
              cx="38"
              cy="38"
              r={radius}
              className="stroke-[#d9cfb8]"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="38"
              cy="38"
              r={radius}
              className={isHighRigor ? "stroke-[#2c3e8c]" : "stroke-[#14181f]"}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: "stroke-dashoffset 0.4s ease-out, stroke 0.4s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-dash font-bold text-lg sm:text-xl text-[#221d16] tracking-tight">
              {overallScore}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#948a76]">
            Citation Rigor
          </span>
          <h3 className="text-sm sm:text-[15px] font-bold text-[#14181f] font-dash truncate">
            {statusLabel}
          </h3>
          <p className="text-xs text-[#5c5344] mt-0.5">
            {unresolved > 0
              ? `${unresolved} suggested revisions pending`
              : "All citations verified and aligned!"}
          </p>
        </div>
      </div>

      {/* 3 Sub-Metric Score Tiles */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#d9cfb8]">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            data-testid={tile.testid}
            className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-2 text-center shadow-none"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#948a76] truncate">
              {tile.label}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#14181f] font-dash mt-0.5">
              {tile.value}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RigorScoreWidget;
