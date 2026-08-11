import type { Metadata } from "next";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — CitePilot",
  description: "How CitePilot collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* Simple nav */}
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
        <h1 className="font-type font-bold text-4xl text-ink mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-faint font-mono mb-10">Last updated: August 2026</p>

        <div className="prose-style space-y-8 text-ink-soft text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">1. Information We Collect</h2>
            <p>
              CitePilot is a <strong className="text-ink">sessionless</strong> tool — we do not require account creation, store user accounts, or maintain persistent user profiles. The only data processed is the manuscript content you submit during a session.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Manuscript text or files uploaded during an audit session (processed in memory, never stored on disk or sent to our database)</li>
              <li>PayPal subscription data — handled entirely by PayPal&apos;s secure infrastructure</li>
              <li>Anonymous usage analytics (page views, session counts) via standard server logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">2. How We Use Your Data</h2>
            <p>
              Manuscript content submitted for audit is processed by our AI pipeline in real-time and is not retained after your session ends. We do not train machine learning models on your submitted content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">3. Third-Party Services</h2>
            <p>CitePilot integrates with the following third-party services:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong className="text-ink">Google Gemini API</strong> — for AI-powered citation analysis (data usage governed by Google&apos;s AI Privacy Notice)</li>
              <li><strong className="text-ink">Crossref, doi.org, OpenAlex & PubMed</strong> — for DOI verification and bibliographic metadata (reference data only, no manuscript text)</li>
              <li><strong className="text-ink">PayPal</strong> — for subscription billing (governed by PayPal&apos;s Privacy Policy)</li>
              <li><strong className="text-ink">Vercel / Railway</strong> — for hosting and edge delivery (governed by their respective privacy policies)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">4. Cookies</h2>
            <p>
              CitePilot sets no authentication or session cookies and no tracking or advertising
              cookies. Interface preferences are kept in your browser&apos;s local storage, and at most
              one first-party consent-preference cookie is set. See our{" "}
              <Link href="/cookie-policy" className="text-brand underline font-semibold">
                Cookie Policy
              </Link>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">5. Data Retention</h2>
            <p>
              Manuscript content exists only in the memory of our processing servers while an
              audit runs; it is purged when the audit completes, with a hard cap of 36 hours from
              upload. Only the citation metadata in your result report (bibliographic facts such
              as authors, titles, years, and DOIs) is persisted, keyed to an unguessable token on
              your device, so you can re-open your report. Payment records are kept for tax
              compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">6. Your Rights</h2>
            <p>
              Under GDPR and applicable data protection laws, you have the right to access, correct, or delete any personal data we hold. Since we hold no persistent user data, there is nothing to request deletion of. For PayPal subscription data, contact PayPal directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">7. Contact</h2>
            <p>
              For privacy-related questions, contact us at{" "}
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
