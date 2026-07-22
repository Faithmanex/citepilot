export default function WhyItMatters() {
  return (
    <section className="py-12 sm:py-20 border-t-2 border-rule" id="problem">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
        <div className="max-w-[58ch] mb-8 sm:mb-11">
          <span className="font-type text-[13px] font-bold tracking-wider text-ink-faint block mb-2.5 before:content-['§\\0020']">
            Why it matters
          </span>
          <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0">
            Three ways a reference list quietly fails you
          </h2>
          <p className="mt-3.5 text-ink-soft text-base leading-[1.6]">
            None of these show up in a normal proofread. They show up in peer
            review, in a viva, or in a retraction notice — after it&apos;s too
            late to fix quietly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-[3px_3px_0_rgba(34,29,22,0.06)]">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-red text-red flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 -rotate-10 bg-paper-card">
              fabricated
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%]">
              A citation that doesn&apos;t exist
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0">
              AI-assisted drafting can invent plausible sources with real author
              names and fake page numbers. CitePilot checks every source against
              live databases, not just your own list.
            </p>
          </div>

          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-[3px_3px_0_rgba(34,29,22,0.06)]">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-ochre text-ochre flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 rotate-7 bg-paper-card">
              mismatched
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%]">
              A reference that says something else
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0">
              The source exists, but the claim attributed to it doesn&apos;t
              hold up — a wrong year, a misquoted finding, a page number
              pointing to the wrong section.
            </p>
          </div>

          <div className="bg-paper-card border-2 border-rule p-6 pr-5.5 relative shadow-[3px_3px_0_rgba(34,29,22,0.06)]">
            <div className="w-[76px] h-[76px] rounded-full border-3 border-green text-green flex items-center justify-center text-center font-bold text-[9.5px] tracking-wider uppercase leading-[1.3] p-1.5 absolute -top-4 -right-3.5 -rotate-6 bg-paper-card">
              retracted
            </div>
            <h3 className="font-type text-[17px] font-bold mt-1.5 mb-2.5 max-w-[85%]">
              A paper that&apos;s since been withdrawn
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-ink-soft m-0">
              A source was solid when published, then formally retracted years
              later. CitePilot cross-references Retraction Watch so an outdated
              citation doesn&apos;t undercut your argument.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

