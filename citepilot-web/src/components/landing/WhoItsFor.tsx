"use client";

const personas = [
  {
    icon: "fa-graduation-cap",
    title: "Postgraduate & Ph.D. Researchers",
    desc: "Ensure 100% citation compliance before dissertation submission and thesis defense.",
  },
  {
    icon: "fa-microscope",
    title: "Academic Authors & Faculty",
    desc: "Prevent reviewer rejections and citation discrepancies prior to journal manuscript submission.",
  },
  {
    icon: "fa-book-open",
    title: "Journal Editors & Peer Reviewers",
    desc: "Accelerate manuscript pre-screening with automated DOI verification and Retraction Watch cross-checks.",
  },
  {
    icon: "fa-university",
    title: "Universities & Research Labs",
    desc: "Deploy department-wide academic integrity standards across all faculty and research outputs.",
  },
];

export default function WhoItsFor() {
  return (
    <section className="py-20 border-b border-slate-200 bg-white" id="who">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider border border-slate-200">
            Target Stakeholders
          </span>
          <h2 className="text-3xl sm:text-4xl font-dash font-extrabold text-slate-900 tracking-tight">
            Built for Academic Excellence
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Trusted by researchers, academic publishers, and higher education institutions worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p) => (
            <div
              key={p.title}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center text-base font-bold">
                <i className={`fas ${p.icon}`} />
              </div>
              <h3 className="text-base font-dash font-bold text-slate-900">
                {p.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
