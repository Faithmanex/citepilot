"use client";

interface CTASectionProps {
  onLaunchApp: () => void;
}

export default function CTASection({ onLaunchApp }: CTASectionProps) {
  return (
    <section className="py-24 bg-slate-900 text-white text-center border-b border-slate-800" id="cta">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 font-mono text-xs font-semibold tracking-wide">
          <i className="fas fa-check-circle" /> READY FOR SUBMISSION
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-dash font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Ensure Citation Integrity Before Journal Submission
        </h2>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Audit your research manuscript in seconds. Verify every citation against live Crossref, PubMed, and Retraction Watch databases.
        </p>
        <div className="pt-4">
          <button
            className="btn btn-primary bg-blue-600 hover:bg-blue-500 text-white border-none font-semibold px-8 py-3.5 text-base shadow-lg"
            onClick={onLaunchApp}
            aria-label="Open Audit Workspace"
          >
            Launch Audit Workspace
          </button>
        </div>
      </div>
    </section>
  );
}
