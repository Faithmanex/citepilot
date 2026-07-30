"use client";

import { useState } from "react";

interface HeaderProps {
  onToggleDashboard: () => void;
}

export default function Header({ onToggleDashboard }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white"
      role="banner"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 max-w-[1240px] mx-auto w-full">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 font-dash font-extrabold text-xl cursor-pointer tracking-tight"
          id="nav-logo"
          tabIndex={0}
          role="button"
          aria-label="CitePilot Home"
        >
          <span
            className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs text-white font-black"
            aria-hidden="true"
          >
            CP
          </span>
          CitePilot
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300 ml-auto mr-8"
          id="nav-marketing-links"
          role="navigation"
          aria-label="Main Navigation"
        >
          <a
            href="#problem"
            className="hover:text-white transition-colors py-2"
          >
            Why It Matters
          </a>
          <a
            href="#how"
            className="hover:text-white transition-colors py-2"
          >
            How It Works
          </a>
          <a
            href="#styles"
            className="hover:text-white transition-colors py-2"
          >
            Citation Standards
          </a>
          <a
            href="#who"
            className="hover:text-white transition-colors py-2"
          >
            Who It&apos;s For
          </a>
          <a
            href="#pricing"
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors py-2"
          >
            Plans &amp; Pricing
          </a>
        </nav>

        <div className="hidden md:block">
          <button
            className="btn btn-primary bg-blue-600 hover:bg-blue-500 text-white border-none font-semibold px-5 py-2.5 text-sm"
            id="btn-toggle-dashboard"
            onClick={onToggleDashboard}
            aria-label="Open Audit Workspace"
          >
            Audit Workspace
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center p-2 text-slate-300 border border-slate-700 rounded-md bg-slate-800"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle Navigation Menu"
        >
          <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-base`} />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 flex flex-col gap-3 text-slate-300"
          aria-label="Mobile Main Navigation"
        >
          <a
            href="#problem"
            className="text-sm font-medium px-3 py-2 rounded hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Why It Matters
          </a>
          <a
            href="#how"
            className="text-sm font-medium px-3 py-2 rounded hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#styles"
            className="text-sm font-medium px-3 py-2 rounded hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Citation Standards
          </a>
          <a
            href="#who"
            className="text-sm font-medium px-3 py-2 rounded hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Who It&apos;s For
          </a>
          <a
            href="#pricing"
            className="text-sm font-semibold text-blue-400 px-3 py-2 rounded hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Plans &amp; Pricing
          </a>
          <button
            className="btn btn-primary bg-blue-600 text-white w-full mt-2"
            id="btn-toggle-dashboard-mobile"
            onClick={() => {
              setMobileMenuOpen(false);
              onToggleDashboard();
            }}
            aria-label="Open Audit Workspace"
          >
            Audit Workspace
          </button>
        </nav>
      )}
    </header>
  );
}
