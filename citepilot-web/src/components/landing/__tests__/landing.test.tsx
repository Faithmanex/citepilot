// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Header, { NAV_CATEGORIES } from "../Header";
import Hero from "../Hero";
import FeatureTriptych from "../FeatureTriptych";
import EnterpriseBand from "../EnterpriseBand";
import CookieConsent, {
  COOKIE_CONSENT_KEY,
  COOKIE_SETTINGS_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
} from "../CookieConsent";
import Footer from "../Footer";
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
    expect(popover).toHaveTextContent("Findings Summary");
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
    expect(microcopy).toHaveTextContent("Your document stays private");
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
    expect(demoContainer).toHaveTextContent("See CitePilot on an example document");
    expect(demoContainer).toHaveTextContent("No sign-up needed");

    // Verify the demo reuses the production editor surface
    expect(screen.getByTestId("interactive-demo-editor")).toBeInTheDocument();
    expect(screen.getByTestId("document-editor-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("findings-summary")).toBeInTheDocument();
  });
});

describe("Milestone 3: FeatureTriptych Component (FeatureTriptych.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders section header and 3 capability cards", () => {
    render(<FeatureTriptych />);
    expect(screen.getByTestId("triptych-badge")).toHaveTextContent("What CitePilot checks");
    expect(screen.getByTestId("triptych-headline")).toHaveTextContent(
      "Specific findings you can act on"
    );

    expect(screen.getByTestId("triptych-card-discovery")).toBeInTheDocument();
    expect(screen.getByTestId("triptych-card-verification")).toBeInTheDocument();
    expect(screen.getByTestId("triptych-card-auditing")).toBeInTheDocument();
  });

  it("describes citation checking in plain, verifiable terms", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-discovery");
    expect(card).toHaveTextContent("01 · CITATIONS");
    expect(card).toHaveTextContent("Check every citation against your reference list");
    expect(card).toHaveTextContent("Flags in-text citations with no matching reference");
  });

  it("describes claim detection in plain, verifiable terms", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-verification");
    expect(card).toHaveTextContent("02 · CLAIMS");
    expect(card).toHaveTextContent("Find claims that need a source");
    expect(card).toHaveTextContent("Detects empirical and statistical claims without a source");
  });

  it("describes reference checks in plain, verifiable terms", () => {
    render(<FeatureTriptych />);
    const card = screen.getByTestId("triptych-card-auditing");
    expect(card).toHaveTextContent("03 · REFERENCES");
    expect(card).toHaveTextContent("Check sources for retraction and reuse");
    expect(card).toHaveTextContent("Retraction and expression-of-concern checks via Crossref");
  });

  it("contains no fabricated metrics or database claims", () => {
    const { container } = render(<FeatureTriptych />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/38ms/i);
    expect(text).not.toMatch(/150M\+/i);
    expect(text).not.toMatch(/100% concordance/i);
    expect(text).not.toMatch(/retraction watch/i);
    expect(text).not.toMatch(/semantic scholar/i);
  });
});

describe("Milestone 3: EnterpriseBand Component (EnterpriseBand.tsx)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders full-bleed teal band with white headings and dual ghost CTAs", () => {
    render(<EnterpriseBand />);
    const band = screen.getByTestId("landing-enterprise-band");
    expect(band).toHaveClass("bg-[#2c3e8c]");
    expect(band).toHaveClass("text-white");

    expect(screen.getByTestId("enterprise-badge")).toHaveTextContent("For institutions");
    expect(screen.getByTestId("enterprise-headline")).toHaveTextContent(
      "CitePilot for universities & research groups"
    );

    expect(screen.getByTestId("enterprise-btn-trial")).toHaveTextContent(
      "Request institutional trial"
    );
    expect(screen.getByTestId("enterprise-btn-demo")).toHaveTextContent("Talk to us");
  });

  it("renders no fabricated aggregate metrics or unverifiable certification claims", () => {
    const { container } = render(<EnterpriseBand />);
    expect(container.querySelectorAll("[data-testid^='enterprise-stat-card-']")).toHaveLength(0);
    expect(screen.queryByTestId("enterprise-stat-grid")).toBeNull();
    expect(screen.queryByTestId("enterprise-compliance-badges")).toBeNull();
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
    expect(footer).toHaveClass("bg-[#221d16]");
    expect(footer).toHaveClass("text-white");

    expect(screen.getByTestId("footer-logo")).toHaveTextContent("CitePilot");
    expect(screen.getByTestId("footer-mission")).toHaveTextContent(
      "Empowering researchers, university labs, and peer reviewers"
    );
  });

  it("makes no unverifiable certification claims", () => {
    const { container } = render(<Footer />);
    expect(screen.queryByTestId("footer-compliance-badges")).toBeNull();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/iso 27001/i);
    expect(text).not.toMatch(/soc-2/i);
    expect(text).not.toMatch(/ferpa/i);
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

  it("renders copyright without fabricated uptime claims", () => {
    const { container } = render(<Footer />);
    const copyright = screen.getByTestId("footer-copyright");
    expect(copyright).toHaveTextContent("CitePilot Inc. All rights reserved.");
    expect(container.textContent ?? "").not.toMatch(/uptime/i);
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

    // 3. FeatureTriptych
    expect(screen.getByTestId("landing-feature-triptych")).toBeInTheDocument();

    // 4. EnterpriseBand
    expect(screen.getByTestId("landing-enterprise-band")).toBeInTheDocument();

    // 5. Footer
    expect(screen.getByTestId("landing-footer")).toBeInTheDocument();

    // 6. CookieConsent
    expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
  });
});
