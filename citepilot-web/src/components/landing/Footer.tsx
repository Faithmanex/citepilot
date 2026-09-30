"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./CookieConsent";

export interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
  isCookieSettings?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLinkItem[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Citation Engine", href: "#live-demo-showcase" },
      { label: "Claim Verifier", href: "#features" },
      { label: "Source Quality Audit", href: "#features" },
      { label: "Browser Extension", href: "/extension" },
      { label: "Overleaf & LaTeX Sync", href: "/integrations/overleaf" },
      { label: "Reference Manager Sync", href: "/integrations/reference-managers" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Individual Researchers", href: "/solutions/researchers" },
      { label: "Graduate Students & PhDs", href: "/solutions/phd-students" },
      { label: "University Labs & PIs", href: "/solutions/university-labs" },
      { label: "Peer Reviewers & Editors", href: "/solutions/peer-reviewers" },
      { label: "Enterprise & Institutions", href: "#enterprise" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation & API", href: "/docs" },
      { label: "Citation Style Guides", href: "#styles" },
      { label: "Retraction Database", href: "https://retractionwatch.com", external: true },
      { label: "Crossref Metadata Index", href: "https://crossref.org", external: true },
      { label: "Research Integrity Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About CitePilot", href: "/about" },
      { label: "Careers", href: "/careers", badge: "Hiring" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Cookie Settings", href: "#", isCookieSettings: true },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleOpenCookieSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
    }
  };

  return (
    <footer
      className="bg-[#221d16] text-white border-t border-white/10"
      role="contentinfo"
      data-testid="landing-footer"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Main Footer 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 sm:pb-16 border-b border-white/10">
          {/* Column 1: Brand & Badges (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c3e8c] rounded-lg"
                aria-label="CitePilot Home"
                data-testid="footer-logo"
              >
                <span
                  className="w-7 h-7 rounded-full border border-[#285235]/60 bg-[#141f16] text-[#6f9578] flex items-center justify-center font-black text-xs shadow-none"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="font-display font-extrabold text-xl text-white tracking-tight">
                  CitePilot
                </span>
              </Link>

              <p
                className="mt-3 text-sm text-[#d9cfb8] leading-relaxed max-w-sm font-sans"
                data-testid="footer-mission"
              >
                Empowering researchers, university labs, and peer reviewers with automated citation
                discovery, real-time claim verification, and proactive source integrity auditing.
              </p>
            </div>

          </div>

          {/* Columns 2-5: Navigation Taxonomies (lg:col-span-2 each) */}
          {FOOTER_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="lg:col-span-2"
              data-testid={`footer-section-${section.title.toLowerCase()}`}
            >
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#d9cfb8] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5 text-sm font-sans">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.isCookieSettings ? (
                      <button
                        type="button"
                        onClick={handleOpenCookieSettings}
                        className="text-[#d9cfb8] hover:text-white transition-colors cursor-pointer text-left inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2c3e8c] rounded"
                        data-testid="footer-cookie-settings-btn"
                      >
                        {link.label}
                      </button>
                    ) : link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d9cfb8] hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2c3e8c] rounded"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3 text-white/40" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[#d9cfb8] hover:text-white transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2c3e8c] rounded"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="px-1.5 py-0.2 rounded-[4px] bg-[#2c3e8c] text-white text-[10px] font-mono font-bold">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright, System Status Pulse, Socials */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#d9cfb8] font-mono">
          {/* Copyright */}
          <div data-testid="footer-copyright">
            &copy; {currentYear} CitePilot Inc. All rights reserved.
          </div>

          {/* Social Links */}
          <div
            className="flex items-center gap-2"
            aria-label="Social Media Channels"
            data-testid="footer-social-links"
          >
            <a
              href="https://twitter.com/citepilot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CitePilot on X / Twitter"
              className="p-2 rounded-[8px] hover:bg-white/10 text-[#d9cfb8] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href="https://github.com/citepilot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CitePilot on GitHub"
              className="p-2 rounded-[8px] hover:bg-white/10 text-[#d9cfb8] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>

            <a
              href="https://linkedin.com/company/citepilot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CitePilot on LinkedIn"
              className="p-2 rounded-[8px] hover:bg-white/10 text-[#d9cfb8] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.67-.75 1.67-1.67s-.75-1.67-1.67-1.67a1.67 1.67 0 0 0-1.67 1.67c0 .92.75 1.67 1.67 1.67m1.39 9.74v-8.37H5.07v8.37h2.78z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
