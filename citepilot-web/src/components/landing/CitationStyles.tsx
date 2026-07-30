const styles = [
  { name: "APA 7", rot: "-6deg" },
  { name: "APA 6", rot: "4deg" },
  { name: "MLA", rot: "-3deg" },
  { name: "Harvard", rot: "7deg" },
  { name: "Vancouver", rot: "-8deg" },
  { name: "Chicago", rot: "3deg" },
  { name: "IEEE", rot: "-4deg" },
  { name: "OSCOLA", rot: "6deg" },
  { name: "Turabian", rot: "-2deg" },
];

export default function CitationStyles() {
  return (
    <section className="py-12 sm:py-20 border-t-2 border-rule" id="styles">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
        <div className="max-w-[58ch] mb-8 sm:mb-11">
          <span className="font-type text-[13px] font-bold tracking-wider text-ink-faint block mb-2.5 before:content-['§\\0020']">
            Citation styles
          </span>
          <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0">
            Write in the style your field expects
          </h2>
          <p className="mt-3.5 text-ink-soft text-base leading-[1.6]">
            CitePilot&apos;s style engine understands the formatting conventions
            and punctuation rules of nine citation styles, so it flags real
            errors — not just stylistic variation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-[18px] justify-center sm:justify-start">
          {styles.map((s) => (
            <div
              key={s.name}
              className="w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full border-3 border-ink-soft flex items-center justify-center text-center font-type font-bold text-[11px] sm:text-xs text-ink-soft uppercase tracking-wider bg-paper-card"
              style={{ transform: `rotate(${s.rot})` }}
            >
              {s.name}
            </div>
          ))}
        </div>

        <p className="mt-8 pt-5 border-t border-dashed border-rule font-type text-xs sm:text-sm font-semibold text-ink-soft">
          Sources checked against:{" "}
          <b className="text-ink">
            Crossref · OpenAlex · PubMed · DOI.org · Retraction Watch
          </b>
        </p>
      </div>
    </section>
  );
}

