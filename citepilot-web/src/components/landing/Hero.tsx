"use client";

interface HeroProps {
  onLaunchApp: () => void;
}

export default function Hero({ onLaunchApp }: HeroProps) {
  return (
    <section className="py-12 md:py-20 overflow-hidden relative border-b-2 border-rule bg-paper">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Hero Content */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-ink/80 bg-paper-card text-ink font-mono text-xs font-bold tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            ACADEMIC CITATION CHECKER
          </div>

          <h1 className="font-type font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.12] text-ink tracking-tight">
            Check your citations <br className="hidden sm:inline" />
            <span className="underline decoration-wavy decoration-emerald-700 underline-offset-6">
              before you submit.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed text-ink-soft font-medium max-w-xl">
            CitePilot checks your manuscript for missing references, mismatched citations, and retracted sources — so you can submit your research with complete confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
            <button
              className="btn btn-primary text-center group shadow-md hover:shadow-lg transition-all"
              onClick={onLaunchApp}
              aria-label="Check your manuscript now"
            >
              <i className="fas fa-file-check text-xs group-hover:scale-110 transition-transform" />
              Check your manuscript
            </button>
            <a
              href="#how"
              className="btn btn-ghost text-center hover:bg-paper-card transition-colors"
            >
              <i className="fas fa-info-circle text-xs text-ink-faint" />
              See how it works
            </a>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-2 font-mono text-xs font-semibold text-ink-faint">
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">APA 7</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">MLA 9</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">Chicago</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">Harvard</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">IEEE</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">Vancouver</span>
            <span className="px-2 py-1 bg-paper-card border border-rule rounded">+3 more</span>
          </div>
        </div>

        {/* Right Manuscript Interactive Card Mockup */}
        <div className="lg:col-span-6">
          <div className="bg-paper-card border-3 border-ink rounded-2xl p-5 sm:p-7 shadow-2xl relative transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b-2 border-dashed border-rule">
              <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-ink-faint">
                <i className="fas fa-file-alt text-brand text-sm" />
                <span>ch3_literature_review.docx — page 14</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                Live Audit Preview
              </span>
            </div>

            <div className="font-type text-sm sm:text-base leading-[2.1] text-ink relative min-h-[160px]">
              <p>
                Recent estimates of citation error in student manuscripts remain persistently understated{" "}
                <span className="relative inline-block px-1 bg-red-bg text-red font-bold rounded cursor-pointer group">
                  (Alavi &amp; Reyes, 2021)
                  <span className="absolute -top-9 right-0 bg-red text-white text-[11px] font-sans font-bold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                    ⚠ Fabricated / Not in Crossref
                  </span>
                </span>
                , particularly across dense reference lists. A correction model proposed shortly after{" "}
                <span className="relative inline-block px-1 bg-amber-100 text-amber-900 font-bold rounded border-b-2 border-amber-500 cursor-pointer group">
                  (Okafor, 2019)
                  <span className="absolute -top-9 right-0 bg-amber-800 text-white text-[11px] font-sans font-bold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                    Check page range
                  </span>
                </span>{" "}
                has been widely cited since, alongside commentary on the same dataset{" "}
                <span className="relative inline-block px-1 bg-emerald-100 text-emerald-900 font-bold rounded border-b-2 border-emerald-600">
                  (Chen &amp; Park, 2022)
                </span>
                .
              </p>
            </div>

            {/* Audit Status Legend */}
            <div className="mt-6 pt-4 border-t border-rule grid grid-cols-3 gap-2 font-mono text-[11px] font-bold text-ink-soft">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-none" />
                <span className="truncate">Verified</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 flex-none" />
                <span className="truncate">Check Info</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-2 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-red flex-none" />
                <span className="truncate">Unverified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
