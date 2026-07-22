"use client";

import type { AuditResponse } from "@/lib/types";

interface CrossrefPanelProps {
  data: AuditResponse | null;
}

export default function CrossrefPanel({ data }: CrossrefPanelProps) {
  const refs = data?.references ?? [];

  return (
    <section className="panel" id="panel-crossref">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Crossref & retraction validation
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Reference entries checked against Crossref for title, author, year,
          journal, volume, issue, page range, and DOI accuracy — plus
          Retraction Watch lookup.
        </p>
      </div>

      <div className="bg-card border-2 border-line rounded-md p-5">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Reference
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Crossref match
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                DOI
              </th>
              <th className="text-left text-[11.5px] uppercase tracking-wider text-dash-ink-faint font-extrabold px-2.5 pb-3 border-b-2 border-line">
                Retraction status
              </th>
            </tr>
          </thead>
          <tbody>
            {refs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-dash-ink-faint py-3 border-b border-line"
                >
                  No Crossref metadata available yet.
                </td>
              </tr>
            ) : (
              refs.map((r, i) => {
    const crVal = r.crossref_validation ?? { crossref_verified: false, discrepancies: [] };
    const isRet = r.status === "retracted";
                return (
                  <tr key={i}>
                    <td className="py-3 px-2.5 border-b border-line font-mono text-[13px] text-dash-ink-soft">
                      {(r.raw_entry ?? "").substring(0, 70)}...
                    </td>
                    <td className="py-3 px-2.5 border-b border-line">
                      {crVal.crossref_verified ? (
                        <span className="pill pill-ok">Verified</span>
                      ) : (
                        <span className="pill pill-err">
                          No Crossref Record
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2.5 border-b border-line font-mono text-[13px] font-semibold text-dash-ink-soft">
                      {r.parsed_doi || "—"}
                    </td>
                    <td className="py-3 px-2.5 border-b border-line">
                      {isRet ? (
                        <span className="pill pill-err">RETRACTED PAPER</span>
                      ) : (
                        <span className="pill pill-ok">Not retracted</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
