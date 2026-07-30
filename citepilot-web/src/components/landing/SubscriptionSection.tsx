"use client";

import PayPalSubscriptionButton from "../subscription/PayPalSubscriptionButton";

interface SubscriptionSectionProps {
  onLaunchApp?: () => void;
}

export default function SubscriptionSection({ onLaunchApp }: SubscriptionSectionProps) {
  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-8 border-b border-slate-200 bg-white"
      aria-label="Subscription and Pricing Plans"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide border border-blue-200">
            Subscription Plans
          </span>
          <h2 className="text-3xl sm:text-4xl font-dash font-extrabold text-slate-900 tracking-tight">
            Academic &amp; Institutional Licensing
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
            Choose the plan that fits your research workflow. Upgrade to CitePilot Pro for unlimited manuscript analysis and automated database verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Standard Tier Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-dash font-bold text-slate-900">Standard Edition</h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
                  Basic Access
                </span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-500 text-sm font-medium ml-2">/ month</span>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Designed for single manuscript checks and manual citation style validation.
              </p>

              <ul className="space-y-3.5 mb-8 text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-emerald-600 text-xs" />
                  <span>Up to 10 manuscript audits per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-emerald-600 text-xs" />
                  <span>APA, MLA, Chicago, IEEE, Harvard support</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-emerald-600 text-xs" />
                  <span>Basic DOI cross-verification</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400">
                  <i className="fas fa-minus text-slate-300 text-xs" />
                  <span>Batch export to BibTeX, RIS, APA Word</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400">
                  <i className="fas fa-minus text-slate-300 text-xs" />
                  <span>Automated AI Citation Repair Engine</span>
                </li>
              </ul>
            </div>

            {onLaunchApp && (
              <button
                onClick={onLaunchApp}
                className="w-full py-3 px-4 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors text-center text-sm"
              >
                Use Standard Workspace
              </button>
            )}
          </div>

          {/* Pro Subscription Tier Card with PayPal Integration */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-semibold uppercase tracking-wider px-4 py-1 rounded-bl-lg">
              Recommended for Researchers
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-dash font-bold text-white flex items-center gap-2">
                  CitePilot Pro
                </h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">Pro Plan</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Automated monthly subscription via PayPal
                </p>
              </div>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Full-featured integrity solution for academic authors, journal editors, and university departments.
              </p>

              <ul className="space-y-3.5 mb-6 text-sm text-slate-200 font-medium">
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-blue-400 text-xs" />
                  <span><strong>Unlimited</strong> Manuscript &amp; Bibliography Audits</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-blue-400 text-xs" />
                  <span><strong>Full Database Access</strong> (Crossref, PubMed, OpenAlex)</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-blue-400 text-xs" />
                  <span><strong>Automated Citation Repair</strong> &amp; Match Engine</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-blue-400 text-xs" />
                  <span>Export to Word, BibTeX, RIS, CSV &amp; JSON</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-blue-400 text-xs" />
                  <span>Priority API Processing &amp; Dedicated Support</span>
                </li>
              </ul>
            </div>

            {/* PayPal Subscription Button Container */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs font-semibold text-center text-slate-400 mb-3">
                Subscribe securely with PayPal:
              </p>
              <PayPalSubscriptionButton />
              <p className="text-[11px] text-center text-slate-500 mt-2">
                <i className="fas fa-lock text-slate-400 mr-1" />
                Cancel anytime directly via PayPal. 256-bit SSL Encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
