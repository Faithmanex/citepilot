"use client";

const styles = [
  { name: "APA 7th Edition", field: "Social Sciences & Psychology" },
  { name: "APA 6th Edition", field: "Social Sciences" },
  { name: "MLA 9th Edition", field: "Humanities & Literature" },
  { name: "Harvard Standard", field: "Multidisciplinary" },
  { name: "Vancouver System", field: "Medicine & Life Sciences" },
  { name: "Chicago 17th (Author-Date)", field: "History & Social Sciences" },
  { name: "IEEE Standard", field: "Engineering & Computer Science" },
  { name: "OSCOLA Oxford", field: "Legal Research & Jurisprudence" },
  { name: "Turabian Manual", field: "Academic Dissertations" },
];

export default function CitationStyles() {
  return (
    <section className="py-20 border-b border-slate-200 bg-slate-50" id="styles">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded bg-slate-200 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider">
            Style Manual Engines
          </span>
          <h2 className="text-3xl sm:text-4xl font-dash font-extrabold text-slate-900 tracking-tight">
            Comprehensive Citation Style Support
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            CitePilot enforces punctuation, capitalization, and author-date rules across major international citation standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {styles.map((s) => (
            <div
              key={s.name}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
            >
              <div>
                <h3 className="font-dash font-bold text-slate-900 text-base">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {s.field}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-none" />
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-slate-900">Database Verification Sources:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-800">
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">Crossref Registry</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">OpenAlex Scholarly Graph</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">PubMed / NLM</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">Retraction Watch</span>
          </div>
        </div>
      </div>
    </section>
  );
}
