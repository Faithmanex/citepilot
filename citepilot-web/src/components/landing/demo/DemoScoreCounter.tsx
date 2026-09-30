"use client";

import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import type { RigorMetrics } from "./types";

export interface DemoScoreCounterProps {
  metrics: RigorMetrics;
  className?: string;
}

export function DemoScoreCounter({ metrics, className = "" }: DemoScoreCounterProps) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06px
  const progressOffset = circumference - (circumference * Math.max(0, Math.min(100, metrics.overallScore))) / 100;

  const isHighRigor = metrics.overallScore >= 85;
  const isSubmissionReady = metrics.overallScore >= 95;

  return (
    <div
      className={`bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-4 sm:p-5 shadow-none flex flex-col gap-3.5 transition-all ${className}`.trim()}
      data-testid="demo-score-counter"
      role="region"
      aria-label="Citation Rigor Scorecard"
    >
      {/* Top Row: Gauge + Status Headline */}
      <div className="flex items-center gap-4">
        {/* 76px Circular SVG Gauge */}
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
              {metrics.overallScore}%
            </span>
          </div>
        </div>

        {/* Status Headline Block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#948a76]">
              Citation Rigor
            </span>
            {isSubmissionReady && (
              <span className="px-1.5 py-0.2 rounded-[4px] bg-[#e7e9f5] text-[#2c3e8c] font-mono font-bold text-[10px] inline-flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Optimal</span>
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-[15px] font-bold text-[#14181f] font-dash truncate">
            {metrics.statusLabel}
          </h3>

          <p className="text-xs text-[#5c5344] mt-0.5 flex items-center gap-1">
            {metrics.unresolvedCount > 0 ? (
              <span>{metrics.unresolvedCount} suggested revisions pending</span>
            ) : (
              <span className="text-[#2c3e8c] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All citations verified and aligned!</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3 Sub-Metric Score Tiles */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#d9cfb8]">
        <div
          className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-2 text-center shadow-none"
          data-testid="metric-tile-source-coverage"
        >
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#948a76] truncate">
            Coverage
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#14181f] font-dash mt-0.5">
            {metrics.sourceCoverage}%
          </div>
        </div>

        <div
          className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-2 text-center shadow-none"
          data-testid="metric-tile-claim-integrity"
        >
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#948a76] truncate">
            Integrity
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#14181f] font-dash mt-0.5">
            {metrics.claimIntegrity}%
          </div>
        </div>

        <div
          className="bg-[#faf6ec] border border-[#d9cfb8] rounded-lg p-2 text-center shadow-none"
          data-testid="metric-tile-scholarly-tone"
        >
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#948a76] truncate">
            Tone
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#14181f] font-dash mt-0.5">
            {metrics.scholarlyTone}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoScoreCounter;
