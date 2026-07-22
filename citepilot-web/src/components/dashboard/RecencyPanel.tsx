"use client";

import type { AuditResponse } from "@/lib/types";

interface RecencyPanelProps {
  data: AuditResponse | null;
}

export default function RecencyPanel({ data }: RecencyPanelProps) {
  const recency = data?.recency ?? {};

  return (
    <section className="panel" id="panel-recency">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Publication recency analytics
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          How current your source list is, measured against typical university
          recency standards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card border-2 border-line rounded-md p-5">
          <h2 className="text-[15px] font-extrabold m-0 mb-4">
            Recency breakdown
          </h2>
          <div id="recency-kv-container">
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Sources Published ≤ 3 Years Ago
              </span>
              <span className="font-mono font-bold">
                {recency.within_3_years_count ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Sources Published ≤ 5 Years Ago
              </span>
              <span className="font-mono font-bold">
                {recency.within_5_years_percent ?? 0}%
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Sources Published ≤ 10 Years Ago
              </span>
              <span className="font-mono font-bold">
                {recency.within_10_years_percent ?? 0}%
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Older Than 10 Years
              </span>
              <span className="font-mono font-bold">
                {recency.older_than_10_years_percent ?? 0}%
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Average Source Age
              </span>
              <span className="font-mono font-bold">
                {recency.average_source_age_years ?? 0} yrs
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-line text-[13.5px] last:border-b-0">
              <span className="text-dash-ink-soft font-semibold">
                Compliance Status
              </span>
              <span className="font-mono font-bold">
                {(recency.recency_compliance_status ?? "N/A").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border-2 border-line rounded-md p-5">
          <h2 className="text-[15px] font-extrabold m-0 mb-4">
            Recency Guidelines
          </h2>
          <ul className="list-none m-0 p-0">
            <li className="flex gap-3 items-start py-3 border-b border-line text-[13.5px]">
              <span className="status-icon status-icon-ok">✓</span>
              <div>
                <div className="font-bold mb-0.5">
                  STEM & Medicine Target
                </div>
                <div className="text-[13px] text-dash-ink-soft leading-[1.5]">
                  Minimum 60% of cited sources published within the last 5
                  years.
                </div>
              </div>
            </li>
            <li className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]">
              <span className="status-icon status-icon-ok">✓</span>
              <div>
                <div className="font-bold mb-0.5">
                  Social Sciences Target
                </div>
                <div className="text-[13px] text-dash-ink-soft leading-[1.5]">
                  Minimum 70% of cited sources published within the last 10
                  years.
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
