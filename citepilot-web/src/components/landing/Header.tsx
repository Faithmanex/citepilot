"use client";

import { useState } from "react";
import BrandLogo from "../brand/BrandLogo";

interface HeaderProps {
  onToggleDashboard: () => void;
}

export default function Header({ onToggleDashboard }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-100 bg-paper/95 backdrop-blur-md border-b-2 border-rule"
      role="banner"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 max-w-[1200px] mx-auto w-full">
        <BrandLogo variant="light" size="md" />

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex gap-7 text-sm font-semibold text-ink-soft ml-auto mr-6"
          id="nav-marketing-links"
          role="navigation"
          aria-label="Main Navigation"
        >
          <a
            href="#problem"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Why Citation Audits Matter
          </a>
          <a
            href="#how"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            How It Works
          </a>
          <a
            href="#styles"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Supported Styles
          </a>
          <a
            href="#who"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Who It&apos;s For
          </a>
          <a
            href="#pricing"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px] font-bold text-brand"
          >
            Pricing
          </a>
        </nav>

        <div className="hidden md:block">
          <button
            className="btn btn-primary"
            id="btn-toggle-dashboard"
            onClick={onToggleDashboard}
            aria-label="Check Manuscript Now"
          >
            <i className="fas fa-[#10B981] fa-file-check text-xs" aria-hidden="true" />{" "}
            Check Manuscript
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-ink border-2 border-ink rounded-md bg-paper-card"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle Navigation Menu"
        >
          <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-lg`} />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-paper-card border-t border-rule px-4 py-4 flex flex-col gap-3"
          aria-label="Mobile Main Navigation"
        >
          <a
            href="#problem"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Why Citation Audits Matter
          </a>
          <a
            href="#how"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#styles"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Supported Styles
          </a>
          <a
            href="#who"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Who It&apos;s For
          </a>
          <a
            href="#pricing"
            className="text-sm font-bold text-brand px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <button
            className="btn btn-primary w-full mt-2"
            id="btn-toggle-dashboard-mobile"
            onClick={() => {
              setMobileMenuOpen(false);
              onToggleDashboard();
            }}
            aria-label="Check Manuscript Now"
          >
            Check Manuscript
          </button>
        </nav>
      )}
    </header>
  );
}

