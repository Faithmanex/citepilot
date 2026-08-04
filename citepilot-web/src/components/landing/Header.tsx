"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "../brand/BrandLogo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-[100] bg-paper/95 backdrop-blur-md border-b-2 border-rule"
      role="banner"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 max-w-[1200px] mx-auto w-full">
        <Link href="/" aria-label="CitePilot Home">
          <BrandLogo variant="light" size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex gap-7 text-sm font-semibold text-ink-soft ml-auto mr-6"
          id="nav-marketing-links"
          role="navigation"
          aria-label="Main Navigation"
        >
          <a href="#problem" className="no-underline border-b-2 border-transparent pb-0.5 transition-all hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]">
            Why It Matters
          </a>
          <a href="#how" className="no-underline border-b-2 border-transparent pb-0.5 transition-all hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]">
            How It Works
          </a>
          <a href="#styles" className="no-underline border-b-2 border-transparent pb-0.5 transition-all hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px]">
            Styles
          </a>
          <a href="#pricing" className="no-underline border-b-2 border-transparent pb-0.5 transition-all hover:text-ink hover:border-ink-soft inline-flex items-center min-h-[44px] font-bold text-brand">
            Pricing
          </a>
        </nav>

        <div className="hidden md:block">
          <button
            className="btn btn-primary"
            id="btn-go-dashboard"
            onClick={() => router.push("/dashboard")}
            aria-label="Check Manuscript Now"
          >
            Check Manuscript
          </button>
        </div>

        {/* Mobile Hamburger */}
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

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-paper-card border-t border-rule px-4 py-4 flex flex-col gap-3"
          aria-label="Mobile Main Navigation"
        >
          {["#problem:Why It Matters", "#how:How It Works", "#styles:Styles", "#pricing:Pricing"].map((item) => {
            const [href, label] = item.split(":");
            return (
              <a
                key={href}
                href={href}
                className="text-sm font-semibold text-ink px-3 py-2 rounded border border-transparent hover:bg-paper"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </a>
            );
          })}
          <button
            className="btn btn-primary w-full mt-2"
            id="btn-go-dashboard-mobile"
            onClick={() => { setMobileMenuOpen(false); router.push("/dashboard"); }}
            aria-label="Check Manuscript Now"
          >
            Check Manuscript
          </button>
        </nav>
      )}
    </header>
  );
}
