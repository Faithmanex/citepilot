const personas = [
  {
    tab: "CARD 01 / STUDENT",
    title: "Students",
    desc: "Catch citation mistakes before your supervisor does, on an assignment or a thesis chapter.",
  },
  {
    tab: "CARD 02 / RESEARCHER",
    title: "Researchers",
    desc: "A last check before submission, so a reviewer's first comment isn't about your reference list.",
  },
  {
    tab: "CARD 03 / EDITOR",
    title: "Editors",
    desc: "Verify a manuscript's sourcing quickly, across styles, without manually pulling every DOI.",
  },
  {
    tab: "CARD 04 / INSTITUTION",
    title: "Institutions",
    desc: "Give every student and faculty member the same citation safety net, at department scale.",
  },
];

export default function WhoItsFor() {
  return (
    <section className="py-20 border-t-2 border-rule" id="who">
      <div className="max-w-[1080px] mx-auto px-8">
        <div className="max-w-[58ch] mb-11">
          <span className="font-type text-[13px] font-bold tracking-wider text-ink-faint block mb-2.5 before:content-['§\\0020']">
            Who it&apos;s for
          </span>
          <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0">
            Anyone whose name goes under the citation
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-5">
          {personas.map((p) => (
            <div
              key={p.tab}
              className="bg-paper-card border-2 border-rule p-5 pr-[18px] pb-[22px] relative"
            >
              <span className="font-type text-[11px] font-bold text-ink-faint tracking-wider mb-5 block">
                {p.tab}
              </span>
              <h3 className="text-[15.5px] font-bold m-0 mb-2">{p.title}</h3>
              <p className="text-sm leading-[1.55] text-ink-soft m-0">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
