"use client";

interface HeroProps {
  onLaunchApp: () => void;
}

export default function Hero({ onLaunchApp }: HeroProps) {
  return (
    <section className="py-10 md:py-[76px] pb-12 md:pb-16 overflow-hidden">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-13 items-center">
        <div>
          <span className="inline-block font-type text-[13px] font-bold tracking-wider text-ink-soft mb-4 sm:mb-5.5 before:content-['[\\0020'] after:content-['\\0020]'] before:text-ink-faint after:text-ink-faint">
            AI CITATION AUDIT
          </span>
          <h1 className="font-type font-bold text-[clamp(28px,4.2vw,46px)] leading-[1.15] m-0">
            Verify every citation. Before your reader does.
          </h1>
          <p className="mt-4 sm:mt-5.5 text-[15px] sm:text-[16.5px] leading-[1.65] text-ink-soft max-w-[48ch]">
            CitePilot marks up your manuscript like an editor with a red pen —
            matching every in-text citation to your reference list, then checking
            each source against Crossref, PubMed and OpenAlex for anything
            fabricated, mismatched or quietly retracted.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mt-6 sm:mt-7.5">
            <button
              className="btn btn-primary w-full sm:w-auto text-center"
              onClick={onLaunchApp}
              aria-label="Check your first document"
            >
              Check your first document
            </button>
            <a href="#how" className="btn btn-ghost w-full sm:w-auto text-center">
              See how it works
            </a>
          </div>
          <p className="mt-5 font-type text-[12px] sm:text-[13px] font-semibold text-ink-faint">
            // 9 citation styles: APA7 · APA6 · MLA · Harvard · Vancouver ·
            Chicago · IEEE · OSCOLA · Turabian
          </p>
        </div>

        <div>
          <div className="bg-paper-card border-2 border-rule scroll-shadow relative p-4 sm:p-[26px_28px_30px]">
            <div className="font-type text-[12px] font-bold text-ink-faint mb-[18px] pb-3 border-b border-dashed border-rule">
              ch3_literature_review.docx — page 14
            </div>
            <div className="font-type text-[13.5px] leading-[2] text-[#2A251C] relative">
              <p>
                Recent estimates of citation error in student manuscripts remain
                persistently understated{" "}
                <span className="relative px-0.5 underline decoration-wavy decoration-red underline-offset-4">
                  (Alavi &amp; Reyes, 2021)
                </span>
                <span className="font-hand text-lg sm:text-xl font-bold leading-[1.15] hidden sm:block absolute whitespace-nowrap text-red top-14 -right-1.5 -rotate-3">
                  fabricated? not
                  <br />
                  in Crossref
                </span>
                , particularly across dense reference lists. A correction model
                proposed shortly after{" "}
                <span className="relative px-0.5 border-b-2 border-ochre border-t-0">
                  (Okafor, 2019)
                </span>
                <span className="font-hand text-lg sm:text-xl font-bold leading-[1.15] hidden sm:block absolute whitespace-nowrap text-ochre top-[118px] right-2 rotate-2">
                  check page
                  <br />
                  range
                </span>{" "}
                has been widely cited since, alongside commentary on the same
                dataset{" "}
                <span className="relative px-0.5 bg-green-bg shadow-[inset_0_-2px_0_var(--color-green)]">
                  (Chen &amp; Park, 2022)
                </span>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-5 flex-wrap mt-5 font-type text-xs font-bold text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <i
                className="w-2.5 h-2.5 inline-block rounded-full"
                style={{ background: "var(--color-green)" }}
              />
              Verified against source
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i
                className="w-2.5 h-2.5 inline-block rounded-full"
                style={{ background: "var(--color-ochre)" }}
              />
              Needs a closer look
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i
                className="w-2.5 h-2.5 inline-block rounded-full"
                style={{ background: "var(--color-red)" }}
              />
              Possibly fabricated
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

