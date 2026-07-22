"use client";

interface CTASectionProps {
  onLaunchApp: () => void;
}

export default function CTASection({ onLaunchApp }: CTASectionProps) {
  return (
    <section className="text-center py-25" id="cta">
      <div className="max-w-[1080px] mx-auto px-8">
        <div className="w-[150px] h-[150px] mx-auto mb-7 rounded-full border-4 border-green text-green flex items-center justify-center font-type font-bold text-base tracking-wider -rotate-7 uppercase leading-[1.3]">
          Ready for
          <br />
          submission
        </div>
        <h2 className="font-type font-bold text-[clamp(24px,3vw,32px)] leading-[1.25] m-0">
          Send your next draft through a citation check first.
        </h2>
        <p className="mt-3.5 text-ink-soft text-base leading-[1.6]">
          Upload a document and see exactly which citations hold up — and which
          ones need a second look — in minutes.
        </p>
        <div className="mt-5">
          <button
            className="btn btn-primary"
            onClick={onLaunchApp}
            aria-label="Open Audit Workspace"
          >
            Open Audit Workspace
          </button>
        </div>
      </div>
    </section>
  );
}
