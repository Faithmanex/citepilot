import type { Metadata } from "next";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — CitePilot",
  description: "Terms and conditions governing your use of CitePilot.",
};

export default function TermsPage() {
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
        <h1 className="font-type font-bold text-4xl text-ink mb-2">Terms of Service</h1>
        <p className="text-sm text-ink-faint font-mono mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-ink-soft text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CitePilot ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">2. Description of Service</h2>
            <p>
              CitePilot is an AI-powered academic citation and reference audit platform. The Service cross-checks manuscript citations and reference list entries against Crossref metadata. CitePilot is a verification aid and does not guarantee academic accuracy or journal acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">3. Service Tiers</h2>
            <p>CitePilot offers the following service tiers:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong className="text-ink">Free Tier</strong> — up to 3 manuscript audits per day, APA 7 / Harvard / MLA style checks</li>
              <li><strong className="text-ink">Professional Tier ($12.99/month)</strong> — unlimited audits, all citation styles, Crossref verification, DOCX/PDF export, priority processing. Billed monthly via PayPal subscription. Cancel anytime from your PayPal account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Submit content you do not own or have the right to process</li>
              <li>Use the Service to circumvent academic integrity requirements</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the API</li>
              <li>Submit malicious files or code through the document upload feature</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. CitePilot does not guarantee that audit results are error-free or constitute professional academic advice. Always verify critical citations independently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CitePilot shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including damages from manuscript submission outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">7. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-ink mb-3">8. Contact</h2>
            <p>
              For legal inquiries:{" "}
              <a href="mailto:legal@citepilot.com" className="text-brand underline font-semibold">
                legal@citepilot.com
              </a>
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
