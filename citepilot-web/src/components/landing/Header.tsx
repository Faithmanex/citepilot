"use client";

import { useState } from "react";

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
        <div
          className="flex items-center gap-2.5 font-extrabold text-lg cursor-pointer"
          id="nav-logo"
          tabIndex={0}
          role="button"
          aria-label="CitePilot Home"
        >
          <span
            className="w-6 h-6 border-2 border-red rounded-full flex items-center justify-center text-[11px] text-red -rotate-8 font-bold"
            aria-hidden="true"
          >
            ✓
          </span>
          CitePilot
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex gap-7 text-sm text-ink-soft ml-auto mr-6"
          id="nav-marketing-links"
          role="navigation"
          aria-label="Main Navigation"
        >
          <a
            href="#problem"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Why it matters
          </a>
          <a
            href="#how"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            How it works
          </a>
          <a
            href="#styles"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Citation styles
          </a>
          <a
            href="#who"
            className="no-underline border-b-2 border-transparent pb-0.5 transition-all duration-150 ease hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]"
          >
            Who it&apos;s for
          </a>
        </nav>

        <div className="hidden md:block">
          <button
            className="btn btn-primary"
            id="btn-toggle-dashboard"
            onClick={onToggleDashboard}
            aria-label="Open Audit Workspace"
          >
            <i className="fas fa-play text-[10px]" aria-hidden="true" />{" "}
            Audit Workspace
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
            Why it matters
          </a>
          <a
            href="#how"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            How it works
          </a>
          <a
            href="#styles"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Citation styles
          </a>
          <a
            href="#who"
            className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
            onClick={() => setMobileMenuOpen(false)}
          >
            Who it&apos;s for
          </a>
          <button
            className="btn btn-primary w-full mt-2"
            id="btn-toggle-dashboard-mobile"
            onClick={() => {
              setMobileMenuOpen(false);
              onToggleDashboard();
            }}
            aria-label="Open Audit Workspace"
          >
            <i className="fas fa-play text-[10px]" aria-hidden="true" />{" "}
            Audit Workspace
          </button>
        </nav>
      )}
    </header>
  );
}

