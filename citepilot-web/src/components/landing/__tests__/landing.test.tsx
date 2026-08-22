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
  OPEN_COOKIE_SETTINGS_EVENT,
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

describe("Milestone 3: Header Component (Header.tsx)", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 64px sticky header with brand logo and correct styling classes", () => {
    render(<Header />);
    const header = screen.getByTestId("landing-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("h-16");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
    expect(header).toHaveClass("border-b");

    const logo = screen.getByTestId("header-logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("CitePilot");
    expect(logo).toHaveTextContent("✓");
  });

  it("renders all 5 center desktop navigation dropdown triggers", () => {
    render(<Header />);
    NAV_CATEGORIES.forEach((cat) => {
      const trigger = screen.getByTestId(`nav-trigger-${cat.id}`);
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent(cat.label);
    });
  });

  it("opens dropdown popover on click or hover and displays items with descriptions", () => {
    render(<Header />);
    const productTrigger = screen.getByTestId("nav-trigger-product");

    // Click trigger to open dropdown
    fireEvent.click(productTrigger);
    const popover = screen.getByTestId("nav-popover-product");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent("Citation & Claim Auditor");
    expect(popover).toHaveTextContent("Retraction & Integrity Watch");
    expect(popover).toHaveTextContent("Style Engine (APA/MLA/IEEE)");
    expect(popover).toHaveTextContent("Rigor Scorecard");

    // Check badge rendering
    expect(popover).toHaveTextContent("Live");
  });

  it("renders desktop CTA buttons and triggers router navigation", () => {
    render(<Header />);
    const loginBtn = screen.getByTestId("header-btn-login");
    const signupBtn = screen.getByTestId("header-btn-signup");

    expect(loginBtn).toBeInTheDocument();
    expect(signupBtn).toBeInTheDocument();
    expect(signupBtn).toHaveTextContent("Get CitePilot — it's free");

    fireEvent.click(loginBtn);
    expect(mockPush).toHaveBeenCalledWith("/login");

    fireEvent.click(signupBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("toggles mobile menu drawer when hamburger button is clicked", () => {
    render(<Header />);
    const toggleBtn = screen.getByTestId("header-mobile-toggle");

    // Drawer should not be present initially
    expect(screen.queryByTestId("header-mobile-drawer")).toBeNull();

    // Open drawer
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("header-mobile-drawer")).toBeInTheDocument();

    // Expand mobile category
    const mobileCatBtn = screen.getByTestId("mobile-nav-cat-product");
    fireEvent.click(mobileCatBtn);
    expect(screen.getByTestId("mobile-nav-items-product")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-items-product")).toHaveTextContent(
      "Citation & Claim Auditor"
    );

    // Click mobile login button
    const mobileLoginBtn = screen.getByTestId("mobile-btn-login");
    fireEvent.click(mobileLoginBtn);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});

describe("Milestone 3: Hero Component (Hero.tsx)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders display headline in Manrope with tight tracking", () => {
    render(<Hero />);
    const headline = screen.getByTestId("hero-headline");
    expect(headline).toBeInTheDocument();
    expect(headline).toHaveClass("font-display");
    expect(headline).toHaveClass("tracking-[-0.0100em]");
    expect(headline).toHaveTextContent("Write with absolute");
    expect(headline).toHaveTextContent("academic confidence.");
  });

  it("renders centered editorial subtext and legal microcopy", () => {
    render(<Hero />);
    const subtext = screen.getByTestId("hero-subtext");
    expect(subtext).toBeInTheDocument();
    expect(subtext).toHaveTextContent(
      "CitePilot audits manuscripts in real time for missing references"
    );

    const microcopy = screen.getByTestId("hero-microcopy");
    expect(microcopy).toBeInTheDocument();
    expect(microcopy).toHaveTextContent("Free for individual researchers");
    expect(microcopy).toHaveTextContent("No credit card required");
    expect(microcopy).toHaveTextContent("GDPR & FERPA compliant");
  });

  it("renders dual CTAs and handles primary and demo explore actions", () => {
    render(<Hero />);
    const primaryBtn = screen.getByTestId("hero-btn-primary");
    const demoBtn = screen.getByTestId("hero-btn-demo");

    expect(primaryBtn).toBeInTheDocument();
    expect(demoBtn).toBeInTheDocument();

    fireEvent.click(primaryBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");

    fireEvent.click(demoBtn);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("embeds and renders InteractiveDemoEditor inside the 1200px showcase container", () => {
    render(<Hero />);
    const demoContainer = screen.getByTestId("hero-demo-container");
    expect(demoContainer).toBeInTheDocument();
    expect(demoContainer).toHaveTextContent("CitePilot Live Manuscript Auditor");
    expect(demoContainer).toHaveTextContent("Real-Time Suggestion Engine");

    // Verify InteractiveDemoEditor is rendered
    expect(screen.getByTestId("interactive-demo-editor")).toBeInTheDocument();
    expect(screen.getByTestId("demo-editor-canvas")).toBeInTheDocument();
  });
});

describe("Milestone 3: TrustBar Component (TrustBar.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders social proof headline and badge", () => {
    render(<TrustBar />);
    expect(screen.getByTestId("trustbar-badge")).toHaveTextContent("Institutional Trust & Scale");
    expect(screen.getByTestId("trustbar-headline")).toHaveTextContent(
      "Trusted by 250,000+ researchers across 1,200+ universities worldwide"
    );
  });

  it("renders all 4 social proof metric chips", () => {
    render(<TrustBar />);
    TRUST_METRICS.forEach((metric) => {
      const chip = screen.getByTestId(`trustbar-chip-${metric.id}`);
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent(metric.label);
    });
  });

  it("renders all 8 monochrome partner logos (MIT, Stanford, Oxford, Harvard, etc.)", () => {
    render(<TrustBar />);
    PARTNERS.forEach((partner) => {
      const logoCard = screen.getByTestId(`partner-logo-${partner.id}`);
      expect(logoCard).toBeInTheDocument();
      expect(logoCard).toHaveTextContent(partner.shortName);
    });
  });
});

describe("Milestone 3: FeatureTriptych Component (FeatureTriptych.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders section header and 3 core capability cards", () => {
    render(<FeatureTriptych />);
    expect(screen.getByTestId("triptych-badge")).toHaveTextContent("Core Capabilities");
    expect(screen.getByTestId("triptych-headline")).toHaveTextContent(
      "Precision citation intelligence for rigorous manuscripts"
    );

    expect(screen.getByTestId("triptych-card-discovery")).toBeInTheDocument();
    expect(screen.getByTestId("triptych-card-verification")).toBeInTheDocument();
    expect(screen.getByTestId("triptych-card-auditing")).toBeInTheDocument();
  });

  it("renders Citation Discovery card with CrossRef live resolution visual mockup", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-discovery");
    expect(card).toHaveTextContent("01 · CITATION DISCOVERY");
    expect(card).toHaveTextContent("Real-Time CrossRef & Semantic Scholar Resolution");
    expect(card).toHaveTextContent("CrossRef Resolution");
    expect(card).toHaveTextContent("38ms");
    expect(card).toHaveTextContent("Automated Synthesis of Nanoscale Alloys");
    expect(card).toHaveTextContent("150M+ DOIs & CrossRef metadata sync");
  });

  it("renders Claim Verification card with numerical claim assertion check visual mockup", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-verification");
    expect(card).toHaveTextContent("02 · CLAIM VERIFICATION");
    expect(card).toHaveTextContent("Automated Numerical & Fact-Checking Validation");
    expect(card).toHaveTextContent("42.8% reduction");
    expect(card).toHaveTextContent("Assertion Check: Confirmed");
    expect(card).toHaveTextContent("100% Concordance");
    expect(card).toHaveTextContent("Numerical percentage & p-value concordance");
  });

  it("renders Source Quality Auditing card with Retraction Watch alert visual mockup", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-auditing");
    expect(card).toHaveTextContent("03 · SOURCE QUALITY AUDITING");
    expect(card).toHaveTextContent("Retraction Watch Alerts & Journal Integrity Scoring");
    expect(card).toHaveTextContent("RETRACTION WATCH ALERT");
    expect(card).toHaveTextContent("Retracted May 2024");
    expect(card).toHaveTextContent("Recommended Safe Alternative:");
    expect(card).toHaveTextContent("Live Retraction Watch database integration");
  });
});

describe("Milestone 3: EnterpriseBand Component (EnterpriseBand.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders full-bleed teal band with white headings and dual ghost CTAs", () => {
    render(<EnterpriseBand />);
    const band = screen.getByTestId("landing-enterprise-band");
    expect(band).toHaveClass("bg-[#027e6f]");
    expect(band).toHaveClass("text-white");

    expect(screen.getByTestId("enterprise-badge")).toHaveTextContent(
      "Enterprise & Institutional Licensing"
    );
    expect(screen.getByTestId("enterprise-headline")).toHaveTextContent(
      "CitePilot for Universities & Research Labs"
    );

    expect(screen.getByTestId("enterprise-btn-trial")).toHaveTextContent(
      "Request institutional trial"
    );
    expect(screen.getByTestId("enterprise-btn-demo")).toHaveTextContent(
      "Schedule enterprise demo"
    );
  });

  it("renders all 4 stat cards with accurate metrics and titles", () => {
    render(<EnterpriseBand />);
    ENTERPRISE_STATS.forEach((stat, idx) => {
      const card = screen.getByTestId(`enterprise-stat-card-${idx}`);
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(stat.metric);
      expect(card).toHaveTextContent(stat.title);
      expect(card).toHaveTextContent(stat.desc);
    });
  });

  it("renders institutional security and compliance badges (SAML, FERPA/GDPR, DPA)", () => {
    render(<EnterpriseBand />);
    const compliance = screen.getByTestId("enterprise-compliance-badges");
    expect(compliance).toHaveTextContent("SAML 2.0 / Okta SSO");
    expect(compliance).toHaveTextContent("FERPA & GDPR Compliant");
    expect(compliance).toHaveTextContent("Custom Institutional DPA & SLA");
  });
});

describe("Milestone 3: CookieConsent Component (CookieConsent.tsx)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders floating cookie banner on first visit when consent is not stored", () => {
    render(<CookieConsent />);
    expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    expect(screen.getByText("Privacy & Academic Integrity")).toBeInTheDocument();
    expect(screen.getByTestId("cookie-btn-accept-all")).toBeInTheDocument();
    expect(screen.getByTestId("cookie-btn-essential")).toBeInTheDocument();
    expect(screen.getByTestId("cookie-btn-customise")).toBeInTheDocument();
  });

  it("does not render when consent is already accepted in localStorage", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();
  });

  it("accepts all cookies, writes to localStorage, and closes banner", () => {
    render(<CookieConsent />);
    const acceptBtn = screen.getByTestId("cookie-btn-accept-all");
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("accepted");
    const settings = JSON.parse(localStorage.getItem(COOKIE_SETTINGS_KEY) || "{}");
    expect(settings.essential).toBe(true);
    expect(settings.performance).toBe(true);
    expect(settings.preferences).toBe(true);

    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();
  });

  it("saves essential only, writes to localStorage, and closes banner", () => {
    render(<CookieConsent />);
    const essentialBtn = screen.getByTestId("cookie-btn-essential");
    fireEvent.click(essentialBtn);

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("essential");
    const settings = JSON.parse(localStorage.getItem(COOKIE_SETTINGS_KEY) || "{}");
    expect(settings.essential).toBe(true);
    expect(settings.performance).toBe(false);
    expect(settings.preferences).toBe(false);

    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();
  });

  it("expands customization drawer, toggles preferences, and saves custom configuration", () => {
    render(<CookieConsent />);
    const customiseBtn = screen.getByTestId("cookie-btn-customise");
    fireEvent.click(customiseBtn);

    expect(screen.getByTestId("cookie-custom-drawer")).toBeInTheDocument();
    expect(screen.getByText("Strictly Necessary")).toBeInTheDocument();
    expect(screen.getByText("Always Active")).toBeInTheDocument();

    // Toggle performance off
    const perfToggle = screen.getByTestId("cookie-toggle-performance");
    fireEvent.click(perfToggle);

    // Save custom preferences
    const saveBtn = screen.getByTestId("cookie-btn-save-custom");
    fireEvent.click(saveBtn);

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("custom");
    const settings = JSON.parse(localStorage.getItem(COOKIE_SETTINGS_KEY) || "{}");
    expect(settings.essential).toBe(true);
    expect(settings.performance).toBe(false);
    expect(settings.preferences).toBe(true);

    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();
  });

  it("re-opens cookie settings when open event is dispatched from footer", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(screen.queryByTestId("cookie-consent-banner")).toBeNull();

    // Dispatch custom event
    act(() => {
      window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
    });

    expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    expect(screen.getByTestId("cookie-custom-drawer")).toBeInTheDocument();
  });
});

describe("Milestone 3: Footer Component (Footer.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 5-column layout in Dark Ink with logo and mission statement", () => {
    render(<Footer />);
    const footer = screen.getByTestId("landing-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("bg-[#0e101a]");
    expect(footer).toHaveClass("text-white");

    expect(screen.getByTestId("footer-logo")).toHaveTextContent("CitePilot");
    expect(screen.getByTestId("footer-mission")).toHaveTextContent(
      "Empowering researchers, university labs, and peer reviewers"
    );
  });

  it("renders all 4 institutional compliance badges (ISO 27001, SOC-2, GDPR, FERPA)", () => {
    render(<Footer />);
    COMPLIANCE_BADGES.forEach((badge) => {
      const badgeElem = screen.getByTestId(
        `badge-${badge.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
      );
      expect(badgeElem).toBeInTheDocument();
      expect(badgeElem).toHaveTextContent(badge.label);
      expect(badgeElem).toHaveTextContent(badge.sub);
    });
  });

  it("renders Product, Solutions, Resources, and Company sections with appropriate links", () => {
    render(<Footer />);
    expect(screen.getByTestId("footer-section-product")).toBeInTheDocument();
    expect(screen.getByTestId("footer-section-solutions")).toBeInTheDocument();
    expect(screen.getByTestId("footer-section-resources")).toBeInTheDocument();
    expect(screen.getByTestId("footer-section-company")).toBeInTheDocument();

    expect(screen.getByText("Citation Engine")).toBeInTheDocument();
    expect(screen.getByText("Claim Verifier")).toBeInTheDocument();
    expect(screen.getByText("Individual Researchers")).toBeInTheDocument();
    expect(screen.getByText("Retraction Database")).toBeInTheDocument();
    expect(screen.getByText("Careers")).toBeInTheDocument();
  });

  it("renders pulsing system status indicator and copyright", () => {
    render(<Footer />);
    const status = screen.getByTestId("footer-system-status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("All systems operational");

    const copyright = screen.getByTestId("footer-copyright");
    expect(copyright).toHaveTextContent("CitePilot Inc. All rights reserved.");
  });

  it("triggers open cookie settings custom event when Cookie Settings link is clicked", () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);

    render(<Footer />);
    const cookieSettingsBtn = screen.getByTestId("footer-cookie-settings-btn");
    fireEvent.click(cookieSettingsBtn);

    expect(listener).toHaveBeenCalled();
    window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
  });
});

describe("Milestone 3: LandingView Master Page Assembly (LandingView.tsx)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("assembles all landing page sections in optimal conversion sequence", () => {
    render(<LandingView />);
    expect(screen.getByTestId("landing-view")).toBeInTheDocument();

    // 1. Header
    expect(screen.getByTestId("landing-header")).toBeInTheDocument();

    // 2. Hero with Interactive Demo
    expect(screen.getByTestId("landing-hero")).toBeInTheDocument();
    expect(screen.getByTestId("interactive-demo-editor")).toBeInTheDocument();

    // 3. TrustBar
    expect(screen.getByTestId("landing-trustbar")).toBeInTheDocument();

    // 4. FeatureTriptych
    expect(screen.getByTestId("landing-feature-triptych")).toBeInTheDocument();

    // 5. EnterpriseBand
    expect(screen.getByTestId("landing-enterprise-band")).toBeInTheDocument();

    // 6. Footer
    expect(screen.getByTestId("landing-footer")).toBeInTheDocument();

    // 7. CookieConsent
    expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
  });
});
