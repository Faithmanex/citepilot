"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NavDropdownItem {
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export interface NavCategory {
  id: "product" | "features" | "solutions" | "pricing" | "resources";
  label: string;
  items: NavDropdownItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "product",
    label: "Product",
    items: [
      {
        title: "Citation & Claim Auditor",
        description: "Real-time manuscript citation verification and claim-to-source matching.",
        href: "#features",
      },
      {
        title: "Retraction & Integrity Watch",
        description: "Deep scanning for retracted papers, predatory journals, and dead DOIs.",
        href: "#features",
        badge: "Live",
      },
      {
        title: "Style Engine (APA/MLA/IEEE)",
        description: "Instant format normalization across 12+ academic reference conventions.",
        href: "#styles",
      },
      {
        title: "Rigor Scorecard",
        description: "Quantitative academic rigor metrics and exportable audit reports.",
        href: "#how",
      },
    ],
  },
  {
    id: "features",
    label: "Features",
    items: [
      {
        title: "Automated Citation Discovery",
        description: "Locate authoritative CrossRef & OpenAlex DOI sources for empirical claims.",
        href: "#how",
      },
      {
        title: "Claim Verification Engine",
        description: "Validate statistical figures and factual assertions against literature.",
        href: "#how",
      },
      {
        title: "Real-time Diff Editor",
        description: "Accept inline citation fixes and resolve formatting flaws with one click.",
        href: "#live-demo-showcase",
      },
      {
        title: "Collaborative Review",
        description: "Share audited manuscripts with co-authors, PIs, and advisors.",
        href: "#testimonials",
      },
    ],
  },
  {
    id: "solutions",
    label: "Solutions",
    items: [
      {
        title: "For PhDs & Graduate Students",
        description: "Ensure dissertation and thesis reference perfection before defense.",
        href: "#who",
      },
      {
        title: "For Academic Researchers",
        description: "Accelerate literature reviews and journal submissions.",
        href: "#who",
      },
      {
        title: "For Research Labs & PIs",
        description: "Standardize citation integrity across multi-author lab papers.",
        href: "#enterprise",
      },
      {
        title: "For Institutions & Libraries",
        description: "Campus-wide integrity tools and research verification.",
        href: "#enterprise",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    items: [
      {
        title: "Free Tier ($0)",
        description: "Free forever for individual researchers (3 manuscripts/month).",
        href: "#pricing",
      },
      {
        title: "Pro Researcher ($12.99/mo)",
        description: "Unlimited manuscript audits, custom style exports, and priority NLP.",
        href: "#pricing",
        badge: "Popular",
      },
      {
        title: "Institutional Site Licenses",
        description: "Enterprise SSO, lab-wide dashboards, and dedicated API access.",
        href: "#enterprise",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      {
        title: "Academic Integrity Guides",
        description: "Best practices for literature reviews, APA 7, MLA 9, and Chicago styles.",
        href: "#styles",
      },
      {
        title: "Documentation & Tutorials",
        description: "Step-by-step guides for LaTeX, Word, Overleaf, and Zotero integration.",
        href: "#how",
      },
      {
        title: "Research Integrity Blog",
        description: "Deep-dives on peer review standards, retraction trends, and NLP.",
        href: "#testimonials",
      },
      {
        title: "Support & Help Center",
        description: "Dedicated academic support and community troubleshooting.",
        href: "#faq",
      },
    ],
  },
];

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleDropdown = (id: string) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const toggleMobileCat = (id: string) => {
    setMobileExpandedCat((prev) => (prev === id ? null : id));
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[100] h-16 bg-[#ffffff]/95 backdrop-blur-md border-b border-[#ebebeb]"
      role="banner"
      data-testid="landing-header"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#027e6f] rounded-lg"
          aria-label="CitePilot Home"
          data-testid="header-logo"
        >
          <span
            className="w-7 h-7 rounded-full border border-[#a7dcd4] bg-[#e6f4f2] text-[#027e6f] flex items-center justify-center font-black text-xs shadow-none transition-transform duration-150 group-hover:scale-105"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="font-display font-extrabold text-xl text-[#0e101a] tracking-tight">
            CitePilot
          </span>
        </Link>

        {/* Center Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2"
          role="navigation"
          aria-label="Main Navigation"
          data-testid="header-nav-desktop"
        >
          {NAV_CATEGORIES.map((category) => {
            const isOpen = activeDropdown === category.id;
            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(category.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown(category.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-testid={`nav-trigger-${category.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold rounded-lg min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#027e6f] cursor-pointer ${
                    isOpen
                      ? "text-[#0e101a] bg-[#f5f5f5]"
                      : "text-[#545454] hover:text-[#0e101a] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#707070] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#0e101a]" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Popover */}
                {isOpen && (
                  <div
                    className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[320px] sm:w-[360px] bg-[#ffffff] border border-[#ebebeb] rounded-lg shadow-none p-2 z-50 animate-fade-in"
                    role="menu"
                    aria-orientation="vertical"
                    data-testid={`nav-popover-${category.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      {category.items.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          role="menuitem"
                          className="group p-2.5 rounded-lg hover:bg-[#f5f5f5] transition-colors flex flex-col gap-0.5 text-left no-underline"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-[#0e101a] group-hover:text-[#027e6f] transition-colors">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-[#e6f4f2] text-[#027e6f] border border-[#a7dcd4]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-[#707070] leading-snug">
                            {item.description}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="hidden md:flex items-center gap-3" data-testid="header-actions-desktop">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/login")}
            className="text-[14px] font-semibold text-[#545454] hover:text-[#0e101a]"
            aria-label="Log in to CitePilot"
            data-testid="header-btn-login"
          >
            Log in
          </Button>

          <Button
            variant="primary"
            size="md"
            withArrow
            onClick={() => router.push("/dashboard")}
            aria-label="Get CitePilot for free"
            data-testid="header-btn-signup"
          >
            Get CitePilot — it&apos;s free
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            data-testid="header-mobile-toggle"
            className="h-10 w-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#ebebeb] bg-[#ffffff] text-[#0e101a] hover:bg-[#f5f5f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#027e6f] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-[#ffffff] border-b border-[#ebebeb] px-4 py-5 flex flex-col gap-4 shadow-none max-h-[calc(100vh-64px)] overflow-y-auto"
          aria-label="Mobile Navigation"
          data-testid="header-mobile-drawer"
        >
          <div className="flex flex-col gap-1">
            {NAV_CATEGORIES.map((category) => {
              const isExpanded = mobileExpandedCat === category.id;
              return (
                <div key={category.id} className="border-b border-[#f5f5f5] last:border-b-0 pb-1">
                  <button
                    type="button"
                    onClick={() => toggleMobileCat(category.id)}
                    aria-expanded={isExpanded}
                    data-testid={`mobile-nav-cat-${category.id}`}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[14px] font-bold text-[#0e101a] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#707070] transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      className="pl-3 pr-1 py-1 flex flex-col gap-1"
                      data-testid={`mobile-nav-items-${category.id}`}
                    >
                      {category.items.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors flex flex-col gap-0.5 no-underline"
                        >
                          <span className="text-[13px] font-bold text-[#0e101a]">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-[#707070]">{item.description}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#ebebeb]">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/login");
              }}
              data-testid="mobile-btn-login"
            >
              Log in
            </Button>
            <Button
              variant="primary"
              size="md"
              withArrow
              fullWidth
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/dashboard");
              }}
              data-testid="mobile-btn-signup"
            >
              Get CitePilot — it&apos;s free
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
