"use client";

import Link from "next/link";
import BrandLogo from "../brand/BrandLogo";

const footerLinks = {
  Product: [
    { label: "How It Works", href: "/#how" },
    { label: "Citation Styles", href: "/#styles" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Company: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact", href: "mailto:hello@citepilot.com" },
  ],
  Resources: [
    { label: "APA 7 Guidelines", href: "https://apastyle.apa.org", external: true },
    { label: "MLA Handbook", href: "https://style.mla.org", external: true },
    { label: "Crossref", href: "https://crossref.org", external: true },
    { label: "Retraction Watch", href: "https://retractionwatch.com", external: true },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-paper border-t-2 border-rule" role="contentinfo">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <BrandLogo variant="light" size="md" className="mb-4" />
            <p className="text-sm text-ink-soft font-medium leading-relaxed max-w-xs">
              AI-powered citation and reference audit for academic manuscripts. Check your manuscript against Crossref metadata before submission.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://twitter.com/citepilot" target="_blank" rel="noopener noreferrer" aria-label="CitePilot on Twitter" className="w-9 h-9 rounded-full border-2 border-rule flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink transition-colors">
                <i className="fab fa-twitter text-sm" />
              </a>
              <a href="https://linkedin.com/company/citepilot" target="_blank" rel="noopener noreferrer" aria-label="CitePilot on LinkedIn" className="w-9 h-9 rounded-full border-2 border-rule flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink transition-colors">
                <i className="fab fa-linkedin-in text-sm" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-black uppercase tracking-widest text-ink mb-4 font-mono">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  const { label, href } = link;
                  const external = "external" in link ? link.external : false;
                  return (
                    <li key={label}>
                      {external ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ink-soft hover:text-ink font-medium transition-colors inline-flex items-center gap-1"
                        >
                          {label}
                          <i className="fas fa-external-link-alt text-[10px] opacity-50" />
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className="text-sm text-ink-soft hover:text-ink font-medium transition-colors"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-faint font-mono">
          <span>© {year} CitePilot. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <a href="mailto:hello@citepilot.com" className="hover:text-ink transition-colors">Contact</a>
          </div>
          <span>v2.0 · Academic Citation Audit Platform</span>
        </div>
      </div>
    </footer>
  );
}
