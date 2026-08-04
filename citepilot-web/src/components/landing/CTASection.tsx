"use client";

import { useRouter } from "next/navigation";

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="text-center py-20 bg-paper border-t-2 border-rule" id="cta">
      <div className="max-w-[1080px] mx-auto px-8">
        <div className="w-[140px] h-[140px] mx-auto mb-7 rounded-full border-3 border-green text-green flex items-center justify-center font-type font-bold text-sm tracking-wider -rotate-6 uppercase leading-[1.3] shadow-sm bg-paper-card">
          Submission
          <br />
          Ready
        </div>
        <h2 className="font-type font-bold text-[clamp(24px,3vw,34px)] leading-[1.25] m-0 text-ink">
          Make your next draft submission-ready.
        </h2>
        <p className="mt-3.5 text-ink-soft text-base sm:text-lg leading-[1.6] font-medium max-w-xl mx-auto">
          Check your citations and references in minutes before sending your manuscript to your journal editor, committee, or supervisor.
        </p>
        <div className="mt-6 max-w-[320px] sm:max-w-none mx-auto">
          <button
            className="btn btn-primary w-full sm:w-auto text-center"
            onClick={() => router.push("/dashboard")}
            aria-label="Check Your Manuscript Now"
          >
            <i className="fas fa-file-check text-xs mr-2" />
            Check Your Manuscript Now
          </button>
        </div>
      </div>
    </section>
  );
}
