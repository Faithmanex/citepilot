"use client";

import type { AuditResponse } from "@/lib/types";

interface ClaimsPanelProps {
  data: AuditResponse | null;
}

export default function ClaimsPanel({ data }: ClaimsPanelProps) {
  const claims = data?.uncited_claims ?? [];

  return (
    <section className="panel" id="panel-claims">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          AI uncited factual claims
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Factual, empirical, or statistical assertions in the body text that
          lack a citation marker.
        </p>
      </div>

      <div id="uncited-claims-container">
        {claims.length === 0 ? (
          <p className="text-dash-ink-faint">No uncited claims detected.</p>
        ) : (
          claims.map((c, i) => (
            <div
              key={i}
              className="border-2 border-line rounded-md p-[18px_20px] mb-3.5 bg-paper-card"
            >
              <div className="text-sm italic font-semibold text-ink mb-2.5 leading-[1.55]">
                &ldquo;{c.claim_text ?? ""}&rdquo;
              </div>
              <div className="flex gap-3.5 font-mono text-[11.5px] font-bold text-dash-ink-faint mb-2.5">
                <span>PARAGRAPH {(c.paragraph_index ?? 0) + 1}</span>
                <span>UNAUTHORED ASSERTION</span>
              </div>
              <div className="text-[13px] text-dash-ink-soft leading-[1.6] pt-2.5 border-t border-dashed border-line">
                {c.educational_context ?? ""}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
