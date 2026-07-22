"use client";

import type { AuditResponse } from "@/lib/types";

interface StylePanelProps {
  data: AuditResponse | null;
}

export default function StylePanel({ data }: StylePanelProps) {
  const warnings = data?.style_warnings ?? [];

  return (
    <section className="panel" id="panel-style">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Style rules auditing
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Style manual rules applied across the bibliography and in-text
          citations.
        </p>
      </div>

      <div className="bg-card border-2 border-line rounded-md p-4 sm:p-5">
        {warnings.length === 0 ? (
          <ul className="list-none m-0 p-0">
            <li className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]">
              <span className="status-icon status-icon-ok">✓</span>
              <div>
                <div className="font-bold mb-0.5" style={{ color: "var(--color-verified)" }}>
                  No style warnings detected
                </div>
              </div>
            </li>
          </ul>
        ) : (
          <ul className="list-none m-0 p-0">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]"
              >
                <span className="status-icon status-icon-warn">!</span>
                <div>
                  <div className="font-bold mb-0.5">
                    {w.code ?? "STYLE_WARNING"}
                  </div>
                  {w.target_text && (
                    <div
                      className="font-mono text-[13px] font-bold text-dash-ink-soft my-1"
                    >
                      Target Content:{" "}
                      <span
                        className="bg-warning-bg px-1.5 py-0.5 rounded-[4px] text-warning"
                      >
                        {w.target_text}
                      </span>
                    </div>
                  )}
                  <div className="text-[13px] text-dash-ink-soft leading-[1.5]">
                    {w.message ?? ""}
                  </div>
                  {w.educational_context && (
                    <div className="text-[13px] text-dash-ink-soft leading-[1.5] mt-1 italic">
                      {w.educational_context}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
