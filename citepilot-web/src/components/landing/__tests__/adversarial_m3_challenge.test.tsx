// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Header, { NAV_CATEGORIES } from "../Header";
import Hero from "../Hero";
import TrustBar, { PARTNERS, TRUST_METRICS } from "../TrustBar";
import FeatureTriptych from "../FeatureTriptych";
import EnterpriseBand, { ENTERPRISE_STATS } from "../EnterpriseBand";
import CookieConsent, {
  COOKIE_CONSENT_KEY,
  COOKIE_SETTINGS_KEY,
} from "../CookieConsent";
import Footer, { COMPLIANCE_BADGES } from "../Footer";
import LandingView from "../LandingView";

// Mock next/navigation useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Milestone 3 Empirical Adversarial Challenge: Header & Navigation Subsystem", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("handles rapid sequential hover and unhover transitions across all 5 navigation categories without stuck states", () => {
    render(<Header />);

    // Rapid hover simulation across categories
    NAV_CATEGORIES.forEach((cat) => {
      const trigger = screen.getByTestId(`nav-trigger-${cat.id}`);
      const parentWrapper = trigger.parentElement!;

      // Mouse enter opens dropdown
      fireEvent.mouseEnter(parentWrapper);
      expect(screen.getByTestId(`nav-popover-${cat.id}`)).toBeInTheDocument();

      // Mouse leave closes dropdown
      fireEvent.mouseLeave(parentWrapper);
      expect(screen.queryByTestId(`nav-popover-${cat.id}`)).toBeNull();
    });
  });

  it("closes active dropdown immediately upon Escape keypress", () => {
    render(<Header />);
    const trigger = screen.getByTestId("nav-trigger-product");
    fireEvent.click(trigger);
    expect(screen.getByTestId("nav-popover-product")).toBeInTheDocument();

    // Fire Escape keydown on document
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(screen.queryByTestId("nav-popover-product")).toBeNull();
  });

  it("closes active dropdown when clicking outside of the header boundary", () => {
    render(
      <div>
        <div data-testid="outside-area">Outside Content</div>
        <Header />
      </div>
    );
    const trigger = screen.getByTestId("nav-trigger-solutions");
    fireEvent.click(trigger);
    expect(screen.getByTestId("nav-popover-solutions")).toBeInTheDocument();

    // Click outside
    const outsideArea = screen.getByTestId("outside-area");
    fireEvent.mouseDown(outsideArea);
    expect(screen.queryByTestId("nav-popover-solutions")).toBeNull();
  });

  it("stress tests mobile hamburger menu: 100 rapid toggle clicks without state desynchronization", () => {
    render(<Header />);
    const toggleBtn = screen.getByTestId("header-mobile-toggle");

    // Rapidly toggle 100 times
    for (let i = 0; i < 100; i++) {
      fireEvent.click(toggleBtn);
    }
    // 100 toggles from closed -> closed (even number)
    expect(screen.queryByTestId("header-mobile-drawer")).toBeNull();

    // 1 more toggle -> open
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("header-mobile-drawer")).toBeInTheDocument();
  });

  it("closes mobile drawer upon Escape keypress", () => {
    render(<Header />);
    const toggleBtn = screen.getByTestId("header-mobile-toggle");
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("header-mobile-drawer")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(screen.queryByTestId("header-mobile-drawer")).toBeNull();
  });

  it("allows expanding and collapsing multiple mobile category accordions and clicking sub-links closes the drawer", () => {
    render(<Header />);
    const toggleBtn = screen.getByTestId("header-mobile-toggle");
    fireEvent.click(toggleBtn);

    // Expand product category
    const productCatBtn = screen.getByTestId("mobile-nav-cat-product");
    fireEvent.click(productCatBtn);
    const productItems = screen.getByTestId("mobile-nav-items-product");
    expect(productItems).toBeInTheDocument();

    // Click a sub-link inside product category
    const firstLink = productItems.querySelector("a")!;
    expect(firstLink).toBeInTheDocument();
    fireEvent.click(firstLink);

    // Mobile drawer should now be closed
    expect(screen.queryByTestId("header-mobile-drawer")).toBeNull();
  });

  it("enforces Grammarly design tokens on Header: 8px border-radius standard, zero drop shadows, and 64px height", () => {
    render(<Header />);
    const header = screen.getByTestId("landing-header");
    expect(header).toHaveClass("h-16");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
    expect(header).toHaveClass("border-b");
    expect(header).toHaveClass("border-[#ebebeb]");

    // Verify desktop buttons have rounded-lg (8px) and zero shadows
    const loginBtn = screen.getByTestId("header-btn-login");
    const signupBtn = screen.getByTestId("header-btn-signup");
    expect(loginBtn.className).toContain("rounded-lg");
    expect(loginBtn.className).toContain("shadow-none");
    expect(signupBtn.className).toContain("rounded-lg");
    expect(signupBtn.className).toContain("shadow-none");
  });
});

describe("Milestone 3 Empirical Adversarial Challenge: Cookie Consent & Footer Event Bus", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("handles restrictive environments where localStorage throws an error gracefully", () => {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;

    // Simulate SecurityError / restricted localStorage
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error("SecurityError: Access is denied for this document");
    });
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error("QuotaExceededError: storage quota exceeded");
    });

    expect(() => {
      render(<CookieConsent />);
    }).not.toThrow();

    const banner = screen.getByTestId("cookie-consent-banner");
    expect(banner).toBeInTheDocument();

    // Clicking Accept All should not throw even if setItem fails
    const acceptBtn = screen.getByTestId("cookie-btn-accept-all");
    expect(() => {
      fireEvent.click(acceptBtn);
    }).not.toThrow();

    // Restore
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
  });

  it("handles corrupted JSON in localStorage COOKIE_SETTINGS_KEY gracefully", () => {
    localStorage.setItem(COOKIE_SETTINGS_KEY, "INVALID_JSON_CORRUPTED_DATA{{{");
    expect(() => {
      render(<CookieConsent />);
    }).not.toThrow();

    // Customise should still open properly
    const customiseBtn = screen.getByTestId("cookie-btn-customise");
    fireEvent.click(customiseBtn);
    expect(screen.getByTestId("cookie-custom-drawer")).toBeInTheDocument();
  });

  it("end-to-end event chain: Footer Cookie Settings button dispatches custom event to re-open closed CookieConsent with customization drawer active", () => {
    // 1. Mark consent as already accepted
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");

    // 2. Render integrated system with LandingView
    render(<LandingView />);

    // Initially, cookie banner is hidden because consent was previously accepted
    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();

    // 3. User clicks "Cookie Settings" in the footer
    const footerCookieBtn = screen.getByTestId("footer-cookie-settings-btn");
    expect(footerCookieBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(footerCookieBtn);
    });

    // 4. CookieConsent banner is awakened and custom drawer is actively open
    expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    expect(screen.getByTestId("cookie-custom-drawer")).toBeInTheDocument();

    // 5. User adjusts toggle: unchecks preferences
    const prefToggle = screen.getByTestId("cookie-toggle-preferences");
    fireEvent.click(prefToggle);

    // 6. User saves preferences
    const saveBtn = screen.getByTestId("cookie-btn-save-custom");
    fireEvent.click(saveBtn);

    // 7. Banner closes and new preferences are recorded in localStorage
    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("custom");
    const stored = JSON.parse(localStorage.getItem(COOKIE_SETTINGS_KEY) || "{}");
    expect(stored.essential).toBe(true);
    expect(stored.preferences).toBe(false);
  });

  it("verifies strictly necessary cookies are always locked and cannot be disabled in customization drawer", () => {
    render(<CookieConsent />);
    const customiseBtn = screen.getByTestId("cookie-btn-customise");
    fireEvent.click(customiseBtn);

    const drawer = screen.getByTestId("cookie-custom-drawer");
    expect(drawer).toHaveTextContent("Strictly Necessary");
    expect(drawer).toHaveTextContent("Always Active");

    // Ensure there is no checkbox toggle for Strictly Necessary
    expect(screen.queryByTestId("cookie-toggle-strictly-necessary")).toBeNull();
  });

  it("verifies footer compliance badges, social media links, and external resource attributes", () => {
    render(<Footer />);

    // Verify all 4 compliance badges
    COMPLIANCE_BADGES.forEach((b) => {
      const badgeElem = screen.getByTestId(`badge-${b.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
      expect(badgeElem).toBeInTheDocument();
      expect(badgeElem.className).toContain("rounded-[8px]");
      expect(badgeElem.className).toContain("shadow-none");
    });

    // Verify external links have target="_blank" and rel="noopener noreferrer"
    const retractionLink = screen.getByText("Retraction Database").closest("a")!;
    expect(retractionLink).toHaveAttribute("target", "_blank");
    expect(retractionLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(retractionLink).toHaveAttribute("href", "https://retractionwatch.com");

    const crossrefLink = screen.getByText("Crossref Metadata Index").closest("a")!;
    expect(crossrefLink).toHaveAttribute("target", "_blank");
    expect(crossrefLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(crossrefLink).toHaveAttribute("href", "https://crossref.org");
  });
});

describe("Milestone 3 Empirical Adversarial Challenge: Responsive Viewport Grid & Token Invariants", () => {
  afterEach(() => {
    cleanup();
  });

  it("verifies Hero component layout structure across 320px, 768px, 1024px, 1200px breakpoints", () => {
    render(<Hero />);

    // Eyebrow badge
    const badge = screen.getByTestId("hero-badge");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("font-mono");

    // Headline tracking and responsive font sizes
    const headline = screen.getByTestId("hero-headline");
    expect(headline.className).toContain("font-display");
    expect(headline.className).toContain("tracking-[-0.0100em]");
    expect(headline.className).toContain("text-3xl");
    expect(headline.className).toContain("sm:text-5xl");
    expect(headline.className).toContain("md:text-6xl");
    expect(headline.className).toContain("lg:text-[64px]");

    // Dual CTAs responsiveness: flex-col on mobile, flex-row on sm+
    const subtext = headline.nextElementSibling;
    const ctaContainer = subtext ? subtext.nextElementSibling : null;
    expect(ctaContainer).not.toBeNull();
    expect(ctaContainer?.className).toContain("flex-col");
    expect(ctaContainer?.className).toContain("sm:flex-row");

    // Interactive Demo Showcase container max width 1200px
    const demoContainer = screen.getByTestId("hero-demo-container");
    expect(demoContainer.className).toContain("max-w-[1200px]");
  });

  it("verifies TrustBar responsive grid: 2 cols at 320px, 4 cols at 768px, 8 cols at 1024px+", () => {
    render(<TrustBar />);
    const logoCloud = screen.getByTestId("trustbar-logo-cloud");
    expect(logoCloud.className).toContain("grid-cols-2");
    expect(logoCloud.className).toContain("sm:grid-cols-4");
    expect(logoCloud.className).toContain("lg:grid-cols-8");

    // Verify all 8 logos adhere to 8px radius standard and shadow-none
    PARTNERS.forEach((partner) => {
      const logoCard = screen.getByTestId(`partner-logo-${partner.id}`);
      expect(logoCard.className).toContain("rounded-[8px]");
      expect(logoCard.className).toContain("shadow-none");
    });

    // Verify metric chips
    TRUST_METRICS.forEach((metric) => {
      const chip = screen.getByTestId(`trustbar-chip-${metric.id}`);
      expect(chip.className).toContain("rounded-[8px]");
      expect(chip.className).toContain("shadow-none");
    });
  });

  it("verifies FeatureTriptych 3-card grid: 1 col on mobile, 3 cols on lg (1024px+)", () => {
    render(<FeatureTriptych />);
    const triptych = screen.getByTestId("landing-feature-triptych");
    const grid = triptych.querySelector(".grid")!;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("lg:grid-cols-3");

    // Verify each card enforces 8px radius standard, hairline border, and zero drop shadows
    const cards = [
      screen.getByTestId("triptych-card-discovery"),
      screen.getByTestId("triptych-card-verification"),
      screen.getByTestId("triptych-card-auditing"),
    ];

    cards.forEach((card) => {
      expect(card.className).toContain("rounded-[8px]");
      expect(card.className).toContain("border-[#ebebeb]");
      expect(card.className).toContain("shadow-none");
    });
  });

  it("verifies EnterpriseBand 4-stat card responsive layout: 1 col on mobile, 2 cols on sm, 4 cols on lg", () => {
    render(<EnterpriseBand />);
    const statGrid = screen.getByTestId("enterprise-stat-grid");
    expect(statGrid.className).toContain("grid-cols-1");
    expect(statGrid.className).toContain("sm:grid-cols-2");
    expect(statGrid.className).toContain("lg:grid-cols-4");

    // Verify all 4 stat cards have rounded-[8px] and shadow-none
    ENTERPRISE_STATS.forEach((_, idx) => {
      const card = screen.getByTestId(`enterprise-stat-card-${idx}`);
      expect(card.className).toContain("rounded-[8px]");
      expect(card.className).toContain("shadow-none");
    });

    // Dual ghost CTAs responsive stacking
    const ctas = screen.getByTestId("enterprise-ctas");
    expect(ctas.className).toContain("flex-col");
    expect(ctas.className).toContain("sm:flex-row");
  });

  it("verifies Footer responsive layout: 1 col on 320px, 2 cols on sm (640px), 3 cols on md (768px), 12 cols on lg (1024px+)", () => {
    render(<Footer />);
    const footer = screen.getByTestId("landing-footer");
    const mainGrid = footer.querySelector(".grid")!;
    expect(mainGrid.className).toContain("grid-cols-1");
    expect(mainGrid.className).toContain("sm:grid-cols-2");
    expect(mainGrid.className).toContain("md:grid-cols-3");
    expect(mainGrid.className).toContain("lg:grid-cols-12");

    // 1200px max container constraint
    const innerContainer = footer.querySelector(".max-w-\\[1200px\\]");
    expect(innerContainer).not.toBeNull();
  });

  it("guarantees 100% absence of unauthorized drop shadow classes across all Milestone 3 owned components", () => {
    const { container: headerContainer } = render(<Header />);
    const { container: heroContainer } = render(<Hero />);
    const { container: trustContainer } = render(<TrustBar />);
    const { container: triptychContainer } = render(<FeatureTriptych />);
    const { container: enterpriseContainer } = render(<EnterpriseBand />);
    const { container: footerContainer } = render(<Footer />);
    const { container: cookieContainer } = render(<CookieConsent />);

    const m3Containers = [
      headerContainer,
      heroContainer,
      trustContainer,
      triptychContainer,
      enterpriseContainer,
      footerContainer,
      cookieContainer,
    ];

    const forbiddenShadows = [
      "shadow-sm",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl",
      "shadow-inner",
    ];

    m3Containers.forEach((container) => {
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const classList = Array.from(el.classList);
        forbiddenShadows.forEach((forbidden) => {
          expect(classList).not.toContain(forbidden);
        });
      });
    });
  });
});
