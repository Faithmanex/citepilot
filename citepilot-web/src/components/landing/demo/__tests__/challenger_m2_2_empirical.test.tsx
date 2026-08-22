// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InteractiveDemoEditor } from "../InteractiveDemoEditor";
import { DemoDraftSelector } from "../DemoDraftSelector";
import { DemoScoreCounter } from "../DemoScoreCounter";
import { DemoSuggestionCard } from "../DemoSuggestionCard";
import { ACADEMIC_DRAFTS, DRAFT_LIST } from "../sampleDrafts";

describe("Milestone 2 Challenger 2 — Empirical UI & Styling Adversarial Challenge Suite", () => {
  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // 1. 8PX RADIUS STANDARD & ZERO PILL (9999PX) SHAPES AUDIT
  // =========================================================================
  describe("1. Strict 8px Border Radius Standard & Pill Shape Elimination", () => {
    it("verifies all buttons in InteractiveDemoEditor adhere to 8px radius standard and have zero pill shapes", () => {
      render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

      // Open a suggestion card to render action buttons
      const lit1Highlight = screen.getByTestId("highlight-lit-1");
      fireEvent.click(lit1Highlight);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(6); // tabs, reset, highlights, dismiss, accept, close

      buttons.forEach((btn) => {
        const classNames = btn.className.split(/\s+/);

        // Disallow pill shapes and oversized radius classes on buttons
        expect(classNames).not.toContain("rounded-full");
        expect(classNames).not.toContain("rounded-2xl");
        expect(classNames).not.toContain("rounded-3xl");
        expect(classNames).not.toContain("rounded-[9999px]");
      });

      // Verify specific tab buttons use rounded-lg
      DRAFT_LIST.forEach((draft) => {
        const tab = screen.getByRole("tab", { name: new RegExp(draft.name, "i") });
        expect(tab).toHaveClass("rounded-lg");
      });

      // Verify Accept & Dismiss buttons use rounded-lg
      const acceptBtn = screen.getByRole("button", { name: /accept fix/i });
      const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
      expect(acceptBtn).toHaveClass("rounded-lg");
      expect(dismissBtn).toHaveClass("rounded-lg");
    });

    it("verifies all card surfaces, score tiles, and container boxes enforce 8px radius standard", () => {
      const { container } = render(<InteractiveDemoEditor defaultDraftId="intro" />);

      // Top container card
      const topContainer = container.querySelector(".max-w-\\[1200px\\] > div");
      expect(topContainer).toHaveClass("rounded-lg");

      // Score counter container & 3 metric tiles
      const scoreCounter = screen.getByTestId("demo-score-counter");
      expect(scoreCounter).toHaveClass("rounded-lg");

      const covTile = screen.getByTestId("metric-tile-source-coverage");
      const intTile = screen.getByTestId("metric-tile-claim-integrity");
      const toneTile = screen.getByTestId("metric-tile-scholarly-tone");
      expect(covTile).toHaveClass("rounded-lg");
      expect(intTile).toHaveClass("rounded-lg");
      expect(toneTile).toHaveClass("rounded-lg");

      // Editor surface container
      const editorCanvas = screen.getByTestId("demo-editor-canvas");
      expect(editorCanvas).toHaveClass("rounded-lg");
    });

    it("verifies DemoSuggestionCard components enforce 8px radius and badges avoid 9999px pills", () => {
      const draft = ACADEMIC_DRAFTS["lit-review"];
      const suggestion = draft.defaultSuggestions[0];
      const handleAccept = vi.fn();
      const handleDismiss = vi.fn();
      const handleClose = vi.fn();

      const { container } = render(
        <DemoSuggestionCard
          suggestion={suggestion}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          onClose={handleClose}
        />
      );

      const card = screen.getByTestId("demo-suggestion-card");
      expect(card).toHaveClass("rounded-lg");

      // Category badge
      const badge = container.querySelector(".inline-flex.items-center");
      expect(badge).toBeInTheDocument();
      expect(badge?.className).not.toContain("rounded-full");
      expect(badge?.className).not.toContain("rounded-[9999px]");

      // Diff preview block
      const diffBlock = card.querySelector(".bg-\\[\\#f5f5f5\\].border");
      expect(diffBlock).toHaveClass("rounded-lg");

      // Metadata block
      const metaBlock = card.querySelector(".font-mono.flex.flex-wrap");
      expect(metaBlock).toHaveClass("rounded-lg");
    });

    it("verifies empty state of DemoSuggestionCard adheres strictly to 8px radius", () => {
      render(
        <DemoSuggestionCard
          suggestion={null}
          onAccept={() => {}}
          onDismiss={() => {}}
        />
      );

      const emptyCard = screen.getByTestId("suggestion-card-empty");
      expect(emptyCard).toHaveClass("rounded-lg");

      const iconWrapper = emptyCard.querySelector(".w-10.h-10");
      expect(iconWrapper).toHaveClass("rounded-lg");
    });

    it("verifies DemoDraftSelector container and all button elements enforce 8px radius", () => {
      render(
        <DemoDraftSelector
          activeDraftId="discussion"
          onSelectDraft={() => {}}
          onReset={() => {}}
          isDirty={true}
        />
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("rounded-lg");

      const resetBtn = screen.getByRole("button", { name: /reset/i });
      expect(resetBtn).toHaveClass("rounded-lg");
    });

    it("verifies custom textarea and preview box in custom typing mode adhere to 8px radius standard", () => {
      const { container } = render(<InteractiveDemoEditor defaultDraftId="custom" />);

      const textarea = screen.getByTestId("custom-manuscript-textarea");
      expect(textarea).toHaveClass("rounded-lg");

      const previewBox = container.querySelector(".p-4.bg-\\[\\#ffffff\\].border");
      expect(previewBox).toBeInTheDocument();
      expect(previewBox).toHaveClass("rounded-lg");
    });
  });

  // =========================================================================
  // 2. ZERO DROP SHADOWS (FLAT SURFACE ELEVATION) AUDIT
  // =========================================================================
  describe("2. Zero Drop Shadows (Flat Surface Elevation) Invariant", () => {
    it("guarantees 100% absence of Tailwind drop shadow classes across InteractiveDemoEditor and subcomponents", () => {
      const { container } = render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

      // Trigger active suggestion card
      const lit1 = screen.getByTestId("highlight-lit-1");
      fireEvent.click(lit1);

      // Disallow shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl, shadow-inner, shadow-2xs, shadow-xs
      const shadowClasses = [
        "shadow-2xs",
        "shadow-xs",
        "shadow-sm",
        "shadow-md",
        "shadow-lg",
        "shadow-xl",
        "shadow-2xl",
        "shadow-inner",
        "drop-shadow-sm",
        "drop-shadow-md",
        "drop-shadow-lg",
        "drop-shadow-xl",
        "drop-shadow-2xl",
      ];

      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const className = el.getAttribute("class") || "";
        shadowClasses.forEach((shadowCls) => {
          expect(
            className.split(/\s+/),
            `Found illicit drop shadow class "${shadowCls}" on element: ${el.tagName}.${className}`
          ).not.toContain(shadowCls);
        });
      });
    });

    it("verifies all card surfaces and interactive elements explicitly declare shadow-none", () => {
      const { container } = render(<InteractiveDemoEditor defaultDraftId="discussion" />);

      const mainContainers = container.querySelectorAll(".border");
      let shadowNoneCount = 0;
      mainContainers.forEach((el) => {
        if (el.className.includes("shadow-none")) {
          shadowNoneCount++;
        }
      });

      expect(shadowNoneCount).toBeGreaterThanOrEqual(4);
    });

    it("verifies spatial separation is achieved strictly through hairline 1px borders", () => {
      const { container } = render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const className = el.getAttribute("class") || "";
        // Disallow heavy borders (border-2, border-4, border-8) on cards except focused rings or badges
        if (className.includes("rounded-lg") && className.includes("bg-")) {
          expect(className).not.toContain("border-4");
          expect(className).not.toContain("border-8");
        }
      });
    });
  });

  // =========================================================================
  // 3. RESPONSIVE LAYOUT & VIEWPORT ADAPTATION AUDIT
  // =========================================================================
  describe("3. Responsive Layout (1200px Max Container, Desktop 60/40 Split & Mobile Docked Stack)", () => {
    it("enforces max-width 1200px layout container with centered alignment (mx-auto)", () => {
      render(<InteractiveDemoEditor />);
      const section = screen.getByTestId("interactive-demo-editor");

      expect(section).toHaveClass("w-full");
      expect(section).toHaveClass("max-w-[1200px]");
      expect(section).toHaveClass("mx-auto");
    });

    it("configures responsive CSS grid: 12-column split on desktop (lg:) and single-column stack on mobile", () => {
      const { container } = render(<InteractiveDemoEditor />);

      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass("grid-cols-1");
      expect(gridContainer).toHaveClass("lg:grid-cols-12");
      expect(gridContainer).toHaveClass("gap-5");
      expect(gridContainer).toHaveClass("lg:gap-6");

      // Left pane (col-span-7 ~ 58-60% width)
      const leftPane = gridContainer?.children[0];
      expect(leftPane).toHaveClass("lg:col-span-7");
      expect(leftPane).toHaveClass("w-full");

      // Right pane (col-span-5 ~ 40-42% width)
      const rightPane = gridContainer?.children[1];
      expect(rightPane).toHaveClass("lg:col-span-5");
      expect(rightPane).toHaveClass("w-full");
    });

    it("verifies DemoDraftSelector supports multi-line flex wrapping on narrow mobile viewports", () => {
      render(<DemoDraftSelector activeDraftId="lit-review" onSelectDraft={() => {}} onReset={() => {}} />);
      const tablist = screen.getByRole("tablist");

      expect(tablist).toHaveClass("flex");
      expect(tablist).toHaveClass("flex-wrap");
      expect(tablist).toHaveClass("justify-between");
    });

    it("verifies DemoScoreCounter sub-metrics utilize a 3-column mobile-friendly grid with text truncation", () => {
      const { container } = render(
        <DemoScoreCounter
          metrics={{
            overallScore: 78,
            sourceCoverage: 80,
            claimIntegrity: 75,
            scholarlyTone: 79,
            totalCount: 4,
            unresolvedCount: 2,
            acceptedCount: 2,
            dismissedCount: 0,
            statusLabel: "Moderate Verification Needed",
            isOptimal: false,
          }}
        />
      );

      const metricGrid = container.querySelector(".grid.grid-cols-3");
      expect(metricGrid).toBeInTheDocument();

      const titles = metricGrid?.querySelectorAll(".truncate");
      expect(titles?.length).toBe(3);
    });

    it("verifies DemoSuggestionCard scholarly metadata handles narrow viewports with text truncation and flex-wrap", () => {
      const draft = ACADEMIC_DRAFTS["lit-review"];
      const suggestion = draft.defaultSuggestions[0];

      const { container } = render(
        <DemoSuggestionCard
          suggestion={suggestion}
          onAccept={() => {}}
          onDismiss={() => {}}
        />
      );

      const metaRow = container.querySelector(".font-mono.flex.flex-wrap");
      expect(metaRow).toBeInTheDocument();
      expect(metaRow).toHaveClass("flex-wrap");

      const truncatedItems = metaRow?.querySelectorAll(".truncate");
      expect(truncatedItems?.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. INTERACTIVE DEMO INTEGRATION & ACCESSIBILITY INVARIANTS
  // =========================================================================
  describe("4. Interactive Demo Integration, State Flow & Accessibility Invariants", () => {
    it("seamlessly handles draft switching across all 4 sample drafts and updates manuscript canvas", () => {
      const onDraftChange = vi.fn();
      render(<InteractiveDemoEditor onDraftChange={onDraftChange} />);

      const drafts: (keyof typeof ACADEMIC_DRAFTS)[] = ["lit-review", "intro", "discussion", "custom"];

      drafts.forEach((draftId) => {
        const tab = screen.getByRole("tab", { name: new RegExp(ACADEMIC_DRAFTS[draftId].name, "i") });
        fireEvent.click(tab);

        expect(tab).toHaveAttribute("aria-selected", "true");
        expect(onDraftChange).toHaveBeenCalledWith(draftId);

        if (draftId === "custom") {
          expect(screen.getByTestId("custom-manuscript-textarea")).toBeInTheDocument();
        } else {
          expect(screen.getByTestId("demo-manuscript-canvas")).toBeInTheDocument();
        }
      });
    });

    it("supports keyboard shortcut interactions (Escape to close, A to accept, D to dismiss) with auto-advance", () => {
      render(<InteractiveDemoEditor defaultDraftId="intro" />);

      // Select bio-1
      const bio1 = screen.getByTestId("highlight-bio-1");
      fireEvent.click(bio1);

      expect(screen.getByTestId("demo-suggestion-card")).toBeInTheDocument();
      expect(screen.getByText("Missing Citation for Variant Fidelity")).toBeInTheDocument();

      // Press 'a' key globally -> accept suggestion bio-1 and auto-advance to bio-2
      fireEvent.keyDown(window, { key: "a", code: "KeyA" });
      expect(screen.getByTestId("demo-suggestion-card")).toBeInTheDocument();
      expect(screen.getByText("Quantitative Off-Target Rate Lacks Citation")).toBeInTheDocument();

      // Press Escape -> closes card
      fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
      expect(screen.getByTestId("suggestion-card-empty")).toBeInTheDocument();

      // Switch to custom draft
      const customTab = screen.getByRole("tab", { name: /custom/i });
      fireEvent.click(customTab);

      const textarea = screen.getByTestId("custom-manuscript-textarea");
      textarea.focus();

      // Type 'a' and 'd' inside textarea -> should NOT fire suggestion actions
      fireEvent.keyDown(textarea, { key: "a", code: "KeyA" });
      fireEvent.keyDown(textarea, { key: "d", code: "KeyD" });
      fireEvent.change(textarea, { target: { value: "added data" } });

      expect(textarea).toHaveValue("added data");
    });

    it("verifies ARIA attributes across all interactive components (role=tablist, role=tab, role=region, aria-selected, aria-expanded)", () => {
      render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

      expect(screen.getByRole("tablist")).toHaveAttribute("aria-label", "Academic Manuscript Sample Drafts");

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-controls", "demo-editor-canvas");
      });

      const highlight = screen.getByTestId("highlight-lit-1");
      expect(highlight).toHaveAttribute("role", "button");
      expect(highlight).toHaveAttribute("aria-haspopup", "dialog");
      expect(highlight).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(highlight);
      expect(highlight).toHaveAttribute("aria-expanded", "true");

      const card = screen.getByTestId("demo-suggestion-card");
      expect(card).toHaveAttribute("role", "region");
    });
  });
});
