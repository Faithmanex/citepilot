"use client";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Document Ingestion",
      desc: "Upload Microsoft Word (.docx), PDF, or plain text manuscripts. CitePilot parses body sections, in-text citations, footnotes, and bibliographies.",
    },
    {
      num: "02",
      title: "Bidirectional Matching Engine",
      desc: "Every in-text citation is parsed and mapped to its corresponding bibliography entry, supporting author-date, numerical, and footnote citation styles.",
    },
    {
      num: "03",
      title: "Live Database Verification",
      desc: "References are validated against Crossref, PubMed, OpenAlex, and Retraction Watch APIs to verify DOIs, title accuracy, and publication metadata.",
    },
    {
      num: "04",
      title: "Automated Report & Export",
      desc: "Receive an itemized audit report detailing matched citations, metadata discrepancies, missing references, and export options (Word, BibTeX, RIS).",
    },
  ];

  return (
    <section className="py-20 border-b border-slate-200 bg-white" id="how">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-12 space-y-3">
          <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider border border-slate-200">
            System Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-dash font-extrabold text-slate-900 tracking-tight">
            Automated 4-Stage Verification Pipeline
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            From raw manuscript input to a comprehensive, itemized citation audit report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex gap-5 items-start shadow-sm"
            >
              <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center flex-none">
                {step.num}
              </span>
              <div className="space-y-1.5">
                <h3 className="text-lg font-dash font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
