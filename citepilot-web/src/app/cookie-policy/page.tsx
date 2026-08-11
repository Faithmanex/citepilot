import type { Metadata } from "next";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — CitePilot",
  description: "How CitePilot uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-paper min-h-screen">
      <header className="border-b-2 border-rule bg-paper/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/">
            <BrandLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-ink-soft hover:text-ink transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-[780px] mx-auto px-6 py-16">
        <span className="inline-block px-3 py-1 rounded-full border-2 border-ink text-xs font-black uppercase tracking-wider bg-paper-card text-ink mb-6">
          Legal
        </span>
        <h1 className="font-type font-bold text-4xl text-ink mb-2">Cookie Policy</h1>
        <p className="text-sm text-ink-faint font-mono mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-ink-soft text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">1. Our Approach</h2>
            <p>
              CitePilot is deliberately cookie-minimal. The Service has{" "}
              <strong className="text-ink">no user accounts and no server-side sessions</strong>, so
              it does not need authentication or session cookies. It runs no advertising and no
              marketing analytics, so it sets no tracking cookies.
            </p>
            <p className="mt-3">
              In practice, the Service sets at most one small first-party cookie (to remember a
              consent choice) and stores lightweight interface preferences in your browser&apos;s
              local storage instead.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">2. Cookies We Set</h2>
            <p>
              <strong className="text-ink">Strictly necessary:</strong>{" "}
              <code className="px-1.5 py-0.5 rounded bg-paper-card border border-rule font-mono text-[13px]">cp_consent</code>{" "}
              — stores your cookie consent choice (if a choice is offered) so we can respect it
              across visits. First-party, lasts 1 year, requires no consent.
            </p>
            <p className="mt-3">
              <strong className="text-ink">Analytics and marketing cookies:</strong> none. We do
              not use web analytics tools, A/B testing platforms, session recording, ad networks,
              or retargeting.
            </p>
            <p className="mt-3">
              <strong className="text-ink">Preferences (browser local storage):</strong>{" "}
              <code className="px-1.5 py-0.5 rounded bg-paper-card border border-rule font-mono text-[13px]">cp_style_pref</code>
              , <code className="px-1.5 py-0.5 rounded bg-paper-card border border-rule font-mono text-[13px]">cp_view_pref</code>
              , <code className="px-1.5 py-0.5 rounded bg-paper-card border border-rule font-mono text-[13px]">cp_theme</code>
              {" "}and <code className="px-1.5 py-0.5 rounded bg-paper-card border border-rule font-mono text-[13px]">cp_filter_state</code>{" "}
              remember your citation style, view mode, theme, and filter settings on your own
              device. Never transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">3. Third-Party Cookies</h2>
            <p>
              <strong className="text-ink">PayPal</strong> handles subscription checkout on its own
              hosted pages (paypal.com) and may set its own cookies there for fraud prevention and
              security, governed by PayPal&apos;s privacy policy. PayPal does not set cookies on
              citepilot.com.
            </p>
            <p className="mt-3">
              Our other providers — Google (Gemini API), Crossref, doi.org, OpenAlex, and PubMed —
              are called server-side and do not set cookies in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">4. Managing Cookies</h2>
            <p>
              Because there are no accounts and no analytics cookies, there is nothing to
              configure in-app. You can block or delete cookies in your browser settings at any
              time; the Service works fully without cookies (preferences simply reset to
              defaults).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">5. Contact</h2>
            <p>
              For questions about our cookie use, contact us at{" "}
              <a href="mailto:privacy@citepilot.com" className="text-brand underline font-semibold">
                privacy@citepilot.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t-2 border-rule py-8 text-center text-xs text-ink-faint font-mono">
        © {new Date().getFullYear()} CitePilot. All rights reserved.
      </footer>
    </div>
  );
}