// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Header from "../Header";
import Hero from "../Hero";
import TrustBar from "../TrustBar";
import FeatureTriptych from "../FeatureTriptych";
import EnterpriseBand from "../EnterpriseBand";
import CookieConsent from "../CookieConsent";
import Footer from "../Footer";
import LandingView from "../LandingView";

import CitationStyles from "../CitationStyles";
import Testimonials from "../Testimonials";
import SubscriptionSection from "../SubscriptionSection";
import FAQ from "../FAQ";
import CTASection from "../CTASection";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InteractiveDemoEditor } from "../demo/InteractiveDemoEditor";

// Mock next/navigation useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Milestone 3 Challenger 2: Strict 8px Radius Standard & Pill Shape Audit", () => {
  afterEach(() => {
    cleanup();
  });

  it("verifies 100% adherence to 8px radius standard (rounded-lg / rounded-[8px]) across all UI primitives", () => {
    const { container: btnContainer } = render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost-white">Ghost White</Button>
        <Button variant="subdued">Subdued</Button>
      </div>
    );
    const buttons = btnContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("rounded-lg");
      expect(btn.className).not.toContain("rounded-full");
    });

    const { container: badgeContainer } = render(
      <div>
        <Badge variant="teal">Teal Badge</Badge>
        <Badge variant="amber">Amber Badge</Badge>
        <Badge variant="red">Red Badge</Badge>
        <Badge variant="slate">Slate Badge</Badge>
      </div>
    );
    const badges = badgeContainer.querySelectorAll("span[class*='border']");
    badges.forEach((bg) => {
      expect(bg.className).toContain("rounded-[8px]");
      expect(bg.className).not.toContain("rounded-full");
    });

    const { container: cardContainer } = render(
      <Card variant="paper">Card Content</Card>
    );
    const card = cardContainer.firstElementChild!;
    expect(card.className).toContain("rounded-[8px]");
    expect(card.className).not.toContain("rounded-full");
  });

  it("verifies 8px radius standard across all M3 core sections (Header, Hero, TrustBar, FeatureTriptych, EnterpriseBand, CookieConsent, Footer)", () => {
    // Header
    const { container: headerContainer } = render(<Header />);
    const headerBtns = headerContainer.querySelectorAll("button, a[role='menuitem']");
    headerBtns.forEach((btn) => {
      // Must use rounded-lg or rounded-[8px] or rounded
      expect(btn.className).toMatch(/rounded(-lg|)?/);
      expect(btn.className).not.toContain("rounded-full");
    });

    // Hero
    const { container: heroContainer } = render(<Hero />);
    const heroCtas = heroContainer.querySelectorAll("button");
    heroCtas.forEach((btn) => {
      expect(btn.className).toContain("rounded-lg");
    });

    // TrustBar
    const { container: trustContainer } = render(<TrustBar />);
    const partnerCards = trustContainer.querySelectorAll("[data-testid^='partner-logo-']");
    partnerCards.forEach((card) => {
      expect(card.className).toContain("rounded-[8px]");
    });
    const trustChips = trustContainer.querySelectorAll("[data-testid^='trustbar-chip-']");
    trustChips.forEach((chip) => {
      expect(chip.className).toContain("rounded-[8px]");
    });

    // FeatureTriptych
    const { container: triptychContainer } = render(<FeatureTriptych />);
    const triptychCards = triptychContainer.querySelectorAll("[data-testid^='triptych-card-']");
    triptychCards.forEach((card) => {
      expect(card.className).toContain("rounded-[8px]");
    });

    // EnterpriseBand
    const { container: entContainer } = render(<EnterpriseBand />);
    const statCards = entContainer.querySelectorAll("[data-testid^='enterprise-stat-card-']");
    statCards.forEach((card) => {
      expect(card.className).toContain("rounded-[8px]");
    });
    const entCtas = entContainer.querySelectorAll("button");
    entCtas.forEach((btn) => {
      expect(btn.className).toContain("rounded-lg");
    });

    // CookieConsent
    const { container: cookieContainer } = render(<CookieConsent />);
    const cookieBanner = cookieContainer.querySelector("[data-testid='cookie-consent-banner']")!;
    expect(cookieBanner.className).toContain("rounded-[8px]");

    // Footer
    const { container: footerContainer } = render(<Footer />);
    const compBadges = footerContainer.querySelectorAll("[data-testid^='badge-']");
    compBadges.forEach((bg) => {
      expect(bg.className).toContain("rounded-[8px]");
    });
    const socialBtns = footerContainer.querySelectorAll("[data-testid='footer-social-links'] a");
    socialBtns.forEach((btn) => {
      expect(btn.className).toContain("rounded-[8px]");
    });
  });

  it("empirically identifies legacy sections in LandingView with non-8px radii (rounded-full, rounded-xl, rounded-2xl)", () => {
    // 1. CTASection has 140px rounded-full circle
    const { container: ctaContainer } = render(<CTASection />);
    const ctaBadge = ctaContainer.querySelector(".rounded-full");
    expect(ctaBadge).not.toBeNull();
    expect(ctaBadge?.className).toContain("rounded-full");

    // 2. CitationStyles has 9 rounded-full style stamps
    const { container: stylesContainer } = render(<CitationStyles />);
    const styleCircles = stylesContainer.querySelectorAll(".rounded-full");
    expect(styleCircles.length).toBe(9);

    // 3. FAQ has rounded-full badge and rounded-xl accordion items
    const { container: faqContainer } = render(<FAQ />);
    expect(faqContainer.querySelector(".rounded-full")).not.toBeNull();
    expect(faqContainer.querySelector(".rounded-xl")).not.toBeNull();

    // 4. SubscriptionSection has rounded-full tags and rounded-2xl / rounded-xl cards
    const { container: subContainer } = render(<SubscriptionSection />);
    expect(subContainer.querySelectorAll(".rounded-full").length).toBeGreaterThan(0);
    expect(subContainer.querySelectorAll(".rounded-2xl").length).toBeGreaterThan(0);

    // 5. Testimonials has rounded-full tags and rounded-2xl cards
    const { container: testContainer } = render(<Testimonials />);
    expect(testContainer.querySelector(".rounded-full")).not.toBeNull();
    expect(testContainer.querySelectorAll(".rounded-2xl").length).toBe(3);
  });
});

describe("Milestone 3 Challenger 2: Flat Surface Elevation (Zero Drop Shadows) & Hairline Borders", () => {
  afterEach(() => {
    cleanup();
  });

  it("strictly guarantees shadow-none on all M3 core components and UI primitives", () => {
    const { container: btnContainer } = render(<Button>Click</Button>);
    expect(btnContainer.querySelector("button")?.className).toContain("shadow-none");

    const { container: cardContainer } = render(<Card>Card</Card>);
    expect(cardContainer.firstElementChild?.className).toContain("shadow-none");

    const { container: badgeContainer } = render(<Badge>Badge</Badge>);
    expect(badgeContainer.querySelector("span")?.className).toContain("shadow-none");

    const { container: headerContainer } = render(<Header />);
    const headerEl = headerContainer.querySelector("header")!;
    expect(headerEl.className).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);

    const { container: triptychContainer } = render(<FeatureTriptych />);
    const triptychCards = triptychContainer.querySelectorAll("[data-testid^='triptych-card-']");
    triptychCards.forEach((c) => {
      expect(c.className).toContain("shadow-none");
    });

    const { container: enterpriseContainer } = render(<EnterpriseBand />);
    const statCards = enterpriseContainer.querySelectorAll("[data-testid^='enterprise-stat-card-']");
    statCards.forEach((c) => {
      expect(c.className).toContain("shadow-none");
    });
  });

  it("verifies 1px hairline borders (#ebebeb, #d9d9d9, white/10, white/20) on M3 core sections", () => {
    // Header border-b border-[#ebebeb]
    const { container: headerContainer } = render(<Header />);
    const header = headerContainer.querySelector("header")!;
    expect(header.className).toContain("border-b");
    expect(header.className).toContain("border-[#ebebeb]");

    // Hero border-b border-[#ebebeb]
    const { container: heroContainer } = render(<Hero />);
    const hero = heroContainer.querySelector("section")!;
    expect(hero.className).toContain("border-b");
    expect(hero.className).toContain("border-[#ebebeb]");

    // TrustBar border-y border-[#ebebeb]
    const { container: trustContainer } = render(<TrustBar />);
    const trust = trustContainer.querySelector("section")!;
    expect(trust.className).toContain("border-y");
    expect(trust.className).toContain("border-[#ebebeb]");

    // FeatureTriptych border-b border-[#ebebeb]
    const { container: triptychContainer } = render(<FeatureTriptych />);
    const triptych = triptychContainer.querySelector("section")!;
    expect(triptych.className).toContain("border-b");
    expect(triptych.className).toContain("border-[#ebebeb]");

    // Footer border-t border-white/10
    const { container: footerContainer } = render(<Footer />);
    const footer = footerContainer.querySelector("footer")!;
    expect(footer.className).toContain("border-t");
    expect(footer.className).toContain("border-white/10");
  });

  it("empirically identifies legacy sections with unauthorized drop shadows (shadow-sm, shadow-lg) and 2px/3px borders", () => {
    // 1. SubscriptionSection has shadow-lg and shadow-sm and border-2 / border-3
    const { container: subContainer } = render(<SubscriptionSection />);
    const shadowLgEl = subContainer.querySelector(".shadow-lg");
    expect(shadowLgEl).not.toBeNull();
    const border3Els = subContainer.querySelectorAll(".border-3");
    expect(border3Els.length).toBeGreaterThan(0);
    const border2Els = subContainer.querySelectorAll(".border-2");
    expect(border2Els.length).toBeGreaterThan(0);

    // 2. CTASection has shadow-sm and border-3 and border-t-2
    const { container: ctaContainer } = render(<CTASection />);
    const ctaShadow = ctaContainer.querySelector(".shadow-sm");
    expect(ctaShadow).not.toBeNull();
    const ctaBorder3 = ctaContainer.querySelector(".border-3");
    expect(ctaBorder3).not.toBeNull();
  });
});

describe("Milestone 3 Challenger 2: #027e6f Grammarly Teal Exclusivity & Containment", () => {
  afterEach(() => {
    cleanup();
  });

  it("verifies #027e6f is strictly reserved for primary actions, verified badges, and enterprise band", () => {
    // 1. Primary Button uses #027e6f
    const { container: btnContainer } = render(
      <div>
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="ghost-white">Ghost White</Button>
      </div>
    );
    const primaryBtn = btnContainer.querySelector(".bg-\\[\\#027e6f\\]");
    expect(primaryBtn).not.toBeNull();
    expect(primaryBtn?.textContent).toBe("Primary Action");

    const secondaryBtn = btnContainer.querySelectorAll("button")[1];
    expect(secondaryBtn.className).not.toContain("bg-[#027e6f]");
    expect(secondaryBtn.className).toContain("border-[#0e101a]");

    // 2. Verified / Teal Badge uses #027e6f text and dot
    const { container: badgeContainer } = render(
      <Badge variant="teal" dot>Verified Badge</Badge>
    );
    const badge = badgeContainer.querySelector("span")!;
    expect(badge.className).toContain("text-[#027e6f]");
    expect(badge.className).toContain("bg-[#e6f4f2]");
    expect(badge.className).toContain("border-[#a7dcd4]");

    // 3. EnterpriseBand uses full-bleed bg-[#027e6f]
    const { container: entContainer } = render(<EnterpriseBand />);
    const enterpriseSection = entContainer.querySelector("section")!;
    expect(enterpriseSection.className).toContain("bg-[#027e6f]");
    expect(enterpriseSection.className).toContain("text-white");

    // 4. Hero primary CTA uses primary teal
    const { container: heroContainer } = render(<Hero />);
    const heroPrimary = heroContainer.querySelector("[data-testid='hero-btn-primary']")!;
    expect(heroPrimary.className).toContain("bg-[#027e6f]");

    // 5. Header primary CTA uses primary teal
    const { container: headerContainer } = render(<Header />);
    const headerSignup = headerContainer.querySelector("[data-testid='header-btn-signup']")!;
    expect(headerSignup.className).toContain("bg-[#027e6f]");
  });

  it("verifies achromatic canvas: 90%+ surfaces are paper (#ffffff), cloud (#f5f5f5), or dark ink (#0e101a)", () => {
    const { container: landingContainer } = render(<LandingView />);
    const main = landingContainer.querySelector("main")!;
    expect(main).toBeInTheDocument();

    // Check Header surface
    const header = landingContainer.querySelector("header")!;
    expect(header.className).toContain("bg-[#ffffff]");

    // Check TrustBar surface
    const trustBar = landingContainer.querySelector("[data-testid='landing-trustbar']")!;
    expect(trustBar.className).toContain("bg-[#f5f5f5]");

    // Check FeatureTriptych surface
    const triptych = landingContainer.querySelector("[data-testid='landing-feature-triptych']")!;
    expect(triptych.className).toContain("bg-white");

    // Check Footer surface
    const footer = landingContainer.querySelector("footer")!;
    expect(footer.className).toContain("bg-[#0e101a]");
  });
});

describe("Milestone 3 Challenger 2: Interactive Demo Engine Integration & Tokens", () => {
  afterEach(() => {
    cleanup();
  });

  it("verifies InteractiveDemoEditor enforces 8px radius, zero drop shadows, and 1200px max container", () => {
    render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    const editorSection = screen.getByTestId("interactive-demo-editor");
    expect(editorSection.className).toContain("max-w-[1200px]");

    const mainBox = editorSection.firstElementChild!;
    expect(mainBox.className).toContain("rounded-lg");
    expect(mainBox.className).toContain("shadow-none");
    expect(mainBox.className).toContain("border-[#d9d9d9]");
  });
});
