export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Upload your draft",
      desc: "Word or PDF, any length. CitePilot parses structure, footnotes and your reference list automatically.",
    },
    {
      num: "02",
      title: "Citations get extracted",
      desc: "Every in-text citation is matched to its entry in your reference list, in whichever style you wrote it in.",
    },
    {
      num: "03",
      title: "Sources get verified",
      desc: "Each reference is checked live against Crossref, PubMed, OpenAlex and Retraction Watch.",
    },
    {
      num: "04",
      title: "Review, annotated",
      desc: "Get your manuscript back with every issue marked in place, and a plain-language note for each.",
    },
  ];

  return (
    <section className="py-12 sm:py-20 border-t-2 border-rule" id="how">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
        <div className="max-w-[58ch] mb-8 sm:mb-11">
          <span className="font-type text-[13px] font-bold tracking-wider text-ink-faint block mb-2.5 before:content-['§\\0020']">
            How it works
          </span>
          <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0">
            Upload, and read the results in minutes
          </h2>
          <p className="mt-3.5 text-ink-soft text-base leading-[1.6]">
            One pipeline, four stages — from a raw document to an annotated,
            citation-by-citation report.
          </p>
        </div>

        <div className="border-2 border-rule bg-paper-card">
          {steps.map((step) => (
            <div
              key={step.num}
              className="grid grid-cols-1 sm:grid-cols-[70px_1fr] gap-2 sm:gap-5 p-4 sm:p-[22px_26px] border-b border-dashed border-rule last:border-b-0 items-start"
            >
              <span className="font-type font-bold text-base text-ink-faint pt-0.5">
                {step.num}
              </span>
              <div>
                <h3 className="text-[16.5px] font-bold m-0 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-ink-soft m-0">
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

