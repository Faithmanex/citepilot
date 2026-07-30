"use client";

import PayPalSubscriptionButton from "../subscription/PayPalSubscriptionButton";

interface SubscriptionSectionProps {
  onLaunchApp?: () => void;
}

export default function SubscriptionSection({ onLaunchApp }: SubscriptionSectionProps) {
  return (
    <section
      id="pricing"
      className="py-16 sm:py-24 px-4 sm:px-8 border-b-2 border-rule bg-paper relative overflow-hidden"
      aria-label="Subscription and Pricing Plans"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full border-2 border-ink text-xs font-black uppercase tracking-wider bg-card text-ink mb-4 shadow-sm">
            Flexible Subscription Plans
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight mb-4">
            Accelerate Your Academic Research & Verification
          </h2>
          <p className="text-base sm:text-lg text-ink-soft leading-relaxed font-medium">
            Unlock unlimited automated Crossref, PubMed, OpenAlex, and Retraction Watch manuscript audits with CitePilot Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Tier Card */}
          <div className="bg-paper-card border-2 border-rule rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-ink transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold text-ink">Standard Free</h3>
                <span className="px-3 py-1 bg-paper border border-rule text-xs font-bold rounded-full text-ink-soft">
                  Basic Access
                </span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-ink">$0</span>
                <span className="text-ink-soft text-sm font-semibold ml-2">/ month</span>
              </div>
              <p className="text-sm text-ink-soft mb-6 font-medium">
                Perfect for quick individual citation style checks and manual inspections.
              </p>

              <ul className="space-y-3 mb-8 text-sm text-ink">
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span>Up to 10 manuscript audits per month</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span>APA, MLA, Chicago, IEEE, Harvard support</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span>Basic DOI cross-verification</span>
                </li>
                <li className="flex items-start gap-2.5 text-ink-soft opacity-60">
                  <i className="fas fa-times text-rule-dark mt-0.5 text-xs" />
                  <span>Batch export to BibTeX, RIS, APA Word</span>
                </li>
                <li className="flex items-start gap-2.5 text-ink-soft opacity-60">
                  <i className="fas fa-times text-rule-dark mt-0.5 text-xs" />
                  <span>DeepSeek V4 AI Automated Citation Repair</span>
                </li>
              </ul>
            </div>

            {onLaunchApp && (
              <button
                onClick={onLaunchApp}
                className="w-full py-3 px-4 border-2 border-ink rounded-xl font-extrabold text-ink bg-paper hover:bg-paper-card transition-colors text-center"
              >
                Use Free Workspace
              </button>
            )}
          </div>

          {/* Pro Subscription Tier Card with PayPal Integration */}
          <div className="bg-paper-card border-3 border-ink rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-ink text-paper text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold text-ink flex items-center gap-2">
                  <i className="fas fa-bolt text-amber-500" /> CitePilot Pro
                </h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-ink">Pro Plan</span>
                </div>
                <p className="text-xs text-ink-soft font-semibold mt-1">
                  Automated monthly subscription via PayPal
                </p>
              </div>

              <p className="text-sm text-ink-soft mb-6 font-medium">
                Comprehensive solution for researchers, universities, journal reviewers, and academic writers.
              </p>

              <ul className="space-y-3 mb-6 text-sm text-ink font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span><strong>Unlimited</strong> Manuscript & Reference Audits</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span><strong>Full API Access</strong> (Crossref, PubMed, OpenAlex, Retraction Watch)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span><strong>AI Auto-Repair</strong> & Citation Matching Engine</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span>Export to Word, BibTeX, RIS, CSV & JSON</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fas fa-check text-emerald-600 mt-0.5 text-xs" />
                  <span>Priority Processing & 24/7 Academic Support</span>
                </li>
              </ul>
            </div>

            {/* PayPal Subscription Button Container */}
            <div className="mt-4 pt-4 border-t border-rule">
              <p className="text-xs font-bold text-center text-ink-soft mb-3">
                Subscribe securely with PayPal:
              </p>
              <PayPalSubscriptionButton />
              <p className="text-[11px] text-center text-ink-soft opacity-75 mt-2">
                <i className="fas fa-shield-alt text-emerald-600 mr-1" />
                Cancel anytime directly from your PayPal account. 256-bit SSL Encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
