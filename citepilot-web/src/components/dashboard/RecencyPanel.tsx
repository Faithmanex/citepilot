"use client";

import type { AuditResponse } from "@/lib/types";
import { Clock, CheckCircle2 } from "lucide-react";

interface RecencyPanelProps {
  data: AuditResponse | null;
}

export default function RecencyPanel({ data }: RecencyPanelProps) {
  const recency = data?.recency ?? {};

  return (
    <section className="space-y-5 animate-fade-in" id="panel-recency">
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
        <h1 className="text-base font-extrabold text-[#0e101a] mb-1 font-display">
          Source Recency Analysis
        </h1>
        <p className="text-xs text-[#545454]">
          Evaluate how current your source list is, using recency thresholds common in academic settings.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-xs text-[#545454]">
            <Clock className="w-4 h-4 flex-none" />
            Upload a manuscript and run an audit to view publication recency analytics.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
            <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono mb-4">
              Recency Breakdown
            </h2>
            <div className="divide-y divide-[#ebebeb] text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-[#545454] font-semibold">Published ≤ 3 Years Ago</span>
                <span className="font-mono font-bold text-[#0e101a]">{recency.within_3_years_count ?? 0}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#545454] font-semibold">Published ≤ 5 Years Ago</span>
                <span className="font-mono font-bold text-[#0e101a]">{recency.within_5_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#545454] font-semibold">Published ≤ 10 Years Ago</span>
                <span className="font-mono font-bold text-[#0e101a]">{recency.within_10_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#545454] font-semibold">Older Than 10 Years</span>
                <span className="font-mono font-bold text-[#0e101a]">{recency.older_than_10_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#545454] font-semibold">Average Source Age</span>
                <span className="font-mono font-bold text-[#0e101a]">{recency.average_source_age_years ?? 0} yrs</span>
              </div>
              <div className="flex justify-between py-2.5 items-center">
                <span className="text-[#545454] font-semibold">Compliance Status</span>
                <span className="font-mono font-bold text-[11px] text-[#027e6f] bg-[#e6f4f2] px-2 py-0.5 rounded-[4px] border border-[#a7dcd4]">
                  {(recency.recency_compliance_status ?? "PASSED").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 shadow-none">
            <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono mb-4">
              Recency Guidelines
            </h2>
            <p className="text-[11px] text-[#707070] -mt-2 mb-3">
              Heuristic thresholds — requirements vary by discipline and assignment brief.
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-start p-3 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-[#027e6f] flex-none mt-0.5" />
                <div>
                  <div className="font-bold text-[#0e101a] mb-0.5">Common STEM heuristic</div>
                  <div className="text-[#545454]">Around 60% of cited sources published within the last 5 years.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-[#027e6f] flex-none mt-0.5" />
                <div>
                  <div className="font-bold text-[#0e101a] mb-0.5">Common social-sciences heuristic</div>
                  <div className="text-[#545454]">Around 70% of cited sources published within the last 10 years.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
