"use client";

export default function WhyItMatters() {
  return (
    <section className="py-20 border-b border-slate-200 bg-slate-50" id="problem">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded bg-slate-200 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider">
            Risk Analysis
          </span>
          <h2 className="text-3xl sm:text-4xl font-dash font-extrabold text-slate-900 tracking-tight">
            Critical Integrity Risks in Academic Reference Lists
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Standard word processor spellcheckers do not validate bibliographies. Reference list failures manifest during peer review, institutional compliance audits, or post-publication reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-base border border-red-200">
              <i className="fas fa-search-minus" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-red-100 text-red-800 border border-red-200">
              Unverified Source
            </span>
            <h3 className="text-lg font-dash font-bold text-slate-900">
              Fabricated or Missing Metadata
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              LLM drafting tools frequently generate plausible citation strings with real author names but invalid DOIs or fake volume numbers. CitePilot verifies every record against live registries.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base border border-amber-200">
              <i className="fas fa-exclamation-circle" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Metadata Discrepancy
            </span>
            <h3 className="text-lg font-dash font-bold text-slate-900">
              Publication Year &amp; Title Mismatches
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              The cited publication exists, but metadata fields contain discrepancies — incorrect year, author order mismatch, or page numbers pointing to an unrelated article.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-200">
              <i className="fas fa-[#059669] fa-shield-alt" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Retraction Notice
            </span>
            <h3 className="text-lg font-dash font-bold text-slate-900">
              Withdrawn or Retracted Papers
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Articles may have been formally retracted post-publication. CitePilot queries Retraction Watch to prevent reliance on invalid research.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
