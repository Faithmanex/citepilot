export default function WhyItMatters() {
  return (
    <section className="py-12 sm:py-20 border-t-2 border-rule bg-paper" id="problem">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
        <div className="max-w-[58ch] mb-8 sm:mb-11">
          <span className="font-type text-[13px] font-bold tracking-wider text-ink-faint block mb-2.5 before:content-['§\\0020']">
            Why citation audits matter
          </span>
          <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0 text-ink">
            Catch citation errors before peer review does
          </h2>
          <p className="mt-3.5 text-ink-soft text-base leading-[1.6] font-medium">
            Citation mistakes often go unnoticed during standard proofreading — until peer review or publication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-sm rounded-xl">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-red text-red flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 -rotate-10 bg-paper-card shadow-sm">
              Missing
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%] text-ink">
              Missing &amp; Unverified Citations
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0 font-medium">
              In-text citations that have no matching entry in your bibliography list, or sources that cannot be located in academic databases.
            </p>
          </div>

          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-sm rounded-xl">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-ochre text-ochre flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 rotate-7 bg-paper-card shadow-sm">
              Mismatched
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%] text-ink">
              Mismatched Reference Details
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0 font-medium">
              Discrepancies in publication year, author name, page numbers, or journal titles between your text and reference list.
            </p>
          </div>

          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-sm rounded-xl">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-green text-green flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 -rotate-6 bg-paper-card shadow-sm">
              Retracted
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%] text-ink">
              Retracted Literature Alerts
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0 font-medium">
              Sources cited in your bibliography that have been withdrawn or retracted post-publication by publishers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

