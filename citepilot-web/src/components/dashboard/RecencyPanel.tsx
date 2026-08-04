"use client";

import type { AuditResponse } from "@/lib/types";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface RecencyPanelProps {
  data: AuditResponse | null;
}

export default function RecencyPanel({ data }: RecencyPanelProps) {
  const recency = data?.recency ?? {};

  return (
    <section className="space-y-5 animate-fade-in" id="panel-recency">
      <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
        <h1 className="text-base font-extrabold text-[#221D16] mb-1 font-dash">
          Publication Recency Analytics
        </h1>
        <p className="text-xs text-[#696050]">
          Evaluate how current your source list is against typical university and journal recency standards.
        </p>
      </div>

      {!data ? (
        <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
          <div className="flex items-center gap-2.5 p-3.5 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl text-xs text-[#696050]">
            <Clock className="w-4 h-4 flex-none" />
            Upload a manuscript and run an audit to view publication recency analytics.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
            <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono mb-4">
              Recency Breakdown
            </h2>
            <div className="divide-y divide-[#C7BC9F]/60 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Published ≤ 3 Years Ago</span>
                <span className="font-mono font-bold text-[#221D16]">{recency.within_3_years_count ?? 0}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Published ≤ 5 Years Ago</span>
                <span className="font-mono font-bold text-[#221D16]">{recency.within_5_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Published ≤ 10 Years Ago</span>
                <span className="font-mono font-bold text-[#221D16]">{recency.within_10_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Older Than 10 Years</span>
                <span className="font-mono font-bold text-[#221D16]">{recency.older_than_10_years_percent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Average Source Age</span>
                <span className="font-mono font-bold text-[#221D16]">{recency.average_source_age_years ?? 0} yrs</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-[#696050] font-semibold">Compliance Status</span>
                <span className="font-mono font-bold text-[#1E5E4B]">
                  {(recency.recency_compliance_status ?? "PASSED").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5">
            <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono mb-4">
              Recency Guidelines
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-start p-3 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#1E5E4B] flex-none mt-0.5" />
                <div>
                  <div className="font-bold text-[#221D16] mb-0.5">STEM & Medicine Target</div>
                  <div className="text-[#696050]">Minimum 60% of cited sources published within the last 5 years.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-[#F1EBDC] border border-[#C7BC9F] rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#1E5E4B] flex-none mt-0.5" />
                <div>
                  <div className="font-bold text-[#221D16] mb-0.5">Social Sciences Target</div>
                  <div className="text-[#696050]">Minimum 70% of cited sources published within the last 10 years.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
