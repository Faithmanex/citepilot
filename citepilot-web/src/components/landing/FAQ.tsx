"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What file types does CitePilot accept?",
    a: "CitePilot accepts .docx, .pdf with selectable text, .txt, .rtf, and .bib files up to 10 MB, or up to 200,000 characters of pasted text. You can also paste manuscript text directly into the dashboard without uploading a file.",
  },
  {
    q: "How does citation matching work?",
    a: "CitePilot performs bidirectional matching — it extracts in-text citations from your manuscript and attempts to match each one against your reference list entries using exact and fuzzy matching. Unmatched citations and orphaned references are flagged automatically.",
  },
  {
    q: "What does Crossref verification check?",
    a: "CitePilot queries Crossref and OpenAlex using parsed DOIs and titles from your reference list. It compares author names, titles, journal names, year of publication, and volume/page ranges, flagging discrepancies. A reference marked unverified is not confirmed correct — it means the metadata check could not complete.",
  },
  {
    q: "Does CitePilot check for retracted papers?",
    a: "Yes. CitePilot flags references where Crossref metadata provides a retraction signal, with guidance on how to update your citation.",
  },
  {
    q: "Is my manuscript stored or used for AI training?",
    a: "Manuscript text is processed in memory to produce the audit and is not used for training. If you are signed in, the audit result is saved to your history automatically so you can reload it; you can delete any saved audit. Server logs record timings and request IDs, not manuscript content.",
  },
  {
    q: "What citation styles are supported?",
    a: "CitePilot supports APA 7th, APA 6th, MLA 9th, Chicago author-date, Chicago notes, Harvard, IEEE, Vancouver, Turabian, and OSCOLA.",
  },
  {
    q: "What is the difference between the Free and Professional plans?",
    a: "The Free plan audits up to 1,500 words per audit, with checks across every supported citation style. The Professional plan ($12.99/month) audits up to 200,000 characters, includes Crossref/OpenAlex verification, annotated DOCX and PDF exports, and email support.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel your subscription at any time directly from your PayPal account — no need to contact us. Your access continues until the end of the current billing period.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      className="py-16 sm:py-24 px-4 sm:px-8 bg-paper border-b-2 border-rule"
      id="faq"
      aria-label="Frequently Asked Questions"
    >
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3.5 py-1 rounded-full border-2 border-ink text-xs font-black uppercase tracking-wider bg-paper-card text-ink mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`border-2 rounded-xl transition-all duration-200 ${isOpen ? "border-ink bg-paper-card" : "border-rule bg-paper hover:border-ink-soft"}`}
              >
                <button
                  type="button"
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  <span className="font-extrabold text-sm sm:text-base text-ink">{q}</span>
                  <i
                    className={`fas fa-chevron-down text-ink-faint transition-transform duration-200 flex-none ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-question-${i}`}
                    className="px-5 pb-5 text-sm text-ink-soft leading-relaxed font-medium border-t border-rule pt-4"
                  >
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
