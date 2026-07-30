"use client";

interface HeroProps {
  onLaunchApp: () => void;
}

export default function Hero({ onLaunchApp }: HeroProps) {
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Enterprise Hero Text */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 font-mono text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            ENTERPRISE ACADEMIC INTEGRITY PLATFORM
          </div>

          <h1 className="font-dash font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
            Academic Citation &amp; Reference Audit Engine
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
            CitePilot validates every in-text citation and reference entry across your manuscript. Automatically cross-check DOIs, titles, and publication records against Crossref, PubMed, OpenAlex, and Retraction Watch.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              className="btn btn-primary text-center px-6 py-3 text-base shadow-md font-semibold"
              onClick={onLaunchApp}
              aria-label="Open Audit Workspace"
            >
              Open Audit Workspace
            </button>
            <a
              href="#how"
              className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-center px-6 py-3 text-base font-semibold transition-colors"
            >
              System Overview
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
            <span className="text-slate-500 font-sans font-medium">Supported Citation Standards:</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">APA 7</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">MLA 9</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Chicago 17</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Harvard</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">IEEE</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Vancouver</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">OSCOLA</span>
          </div>
        </div>

        {/* Right Product Workspace Mockup */}
        <div className="lg:col-span-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Mock Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                <span>manuscript_literature_review.docx</span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                Audit Active
              </span>
            </div>

            {/* Mock Content */}
            <div className="p-6 font-sans text-sm text-slate-300 leading-relaxed space-y-4">
              <p>
                Recent empirical models of citation discrepancies in higher education manuscripts remain significantly under-reported{" "}
                <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/40 font-mono text-xs font-semibold">
                  (Alavi &amp; Reyes, 2021)
                </span>
                , particularly across multi-author systematic literature reviews.
              </p>

              {/* Real-time Audit Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-red-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-exclamation-triangle" /> Crossref Database Exception
                  </span>
                  <span>Flagged #104</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Source metadata not found in Crossref registry. Reference entry &apos;Alavi &amp; Reyes (2021)&apos; missing from bibliography.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded text-[11px]">
                    Uncited Reference
                  </span>
                  <span className="text-slate-500 text-[11px]">Confidence Score: 0.98</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs">
                Subsequent verification frameworks{" "}
                <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono text-xs font-semibold">
                  (Chen &amp; Park, 2022)
                </span>{" "}
                confirmed 100% DOI alignment with PubMed metadata records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
