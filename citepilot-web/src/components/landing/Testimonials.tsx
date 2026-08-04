"use client";

const testimonials = [
  {
    quote: "CitePilot caught three fabricated citations in my systematic review that my co-authors and I had all missed. It saved us from a humiliating post-publication correction.",
    name: "Dr. Amara Osei",
    role: "Senior Researcher, Public Health",
    institution: "University of Ghana",
    initials: "AO",
    color: "#1E5E4B",
  },
  {
    quote: "I run every student dissertation chapter through CitePilot before approval. The Crossref verification alone is worth the subscription — it flags mismatched DOIs instantly.",
    name: "Prof. Elena Marchetti",
    role: "Dissertation Supervisor",
    institution: "University of Bologna",
    initials: "EM",
    color: "#1E3A8A",
  },
  {
    quote: "As a journal reviewer, I recommended CitePilot to our editorial board. It identified two retracted source citations in a manuscript we nearly accepted. Incredible tool.",
    name: "Dr. James Okafor",
    role: "Peer Reviewer & Associate Editor",
    institution: "Journal of Academic Integrity",
    initials: "JO",
    color: "#825500",
  },
];

export default function Testimonials() {
  return (
    <section
      className="py-16 sm:py-24 px-4 sm:px-8 bg-paper-card border-b-2 border-rule"
      aria-label="Testimonials"
      id="testimonials"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3.5 py-1 rounded-full border-2 border-ink text-xs font-black uppercase tracking-wider bg-paper text-ink mb-4">
            Trusted by Researchers
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
            Used by academics worldwide
          </h2>
          <p className="text-ink-soft font-medium mt-3">
            From PhD students to senior journal editors, researchers trust CitePilot before every submission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, institution, initials, color }) => (
            <div
              key={name}
              className="bg-paper border-2 border-rule rounded-2xl p-6 flex flex-col gap-5 hover:border-ink transition-all hover:-translate-y-0.5 duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1" aria-label="5 out of 5 stars">
                {Array(5).fill(0).map((_, i) => (
                  <i key={i} className="fas fa-star text-amber-500 text-xs" aria-hidden="true" />
                ))}
              </div>

              <blockquote className="font-type text-[15px] leading-[1.7] text-ink flex-1">
                &ldquo;{quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 pt-3 border-t border-rule">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-none"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-ink">{name}</div>
                  <div className="text-[11px] text-ink-faint font-semibold">{role}</div>
                  <div className="text-[11px] text-ink-faint font-mono">{institution}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
