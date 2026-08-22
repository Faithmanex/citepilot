// @vitest-environment jsdom
import React, { createRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Button } from "../button";
import { Badge } from "../badge";
import { Tag } from "../tag";
import { Container } from "../container";
import { Section } from "../section";
import { Card } from "../card";

describe("Milestone 1 Adversarial Stress Harness", () => {
  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // 1. BUTTON COMPONENT STRESS & ADVERSARIAL TESTS
  // =========================================================================
  describe("Button: Adversarial Props, Clicks, and Edge Cases", () => {
    it("handles rapid sequential clicks (100 clicks) when enabled", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Clicker</Button>);
      const btn = screen.getByRole("button", { name: /rapid clicker/i });

      for (let i = 0; i < 100; i++) {
        fireEvent.click(btn);
      }
      expect(handleClick).toHaveBeenCalledTimes(100);
    });

    it("completely blocks 100 rapid clicks when disabled", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Clicker
        </Button>
      );
      const btn = screen.getByRole("button", { name: /disabled clicker/i });

      for (let i = 0; i < 100; i++) {
        fireEvent.click(btn);
      }
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("completely blocks 100 rapid clicks when isLoading is true", () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Loading Clicker
        </Button>
      );
      const btn = screen.getByRole("button", { name: /loading clicker/i });

      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-busy", "true");

      for (let i = 0; i < 100; i++) {
        fireEvent.click(btn);
      }
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("handles conflicting props: isLoading=true + disabled=false + withArrow=true + leftIcon + rightIcon", () => {
      const handleClick = vi.fn();
      render(
        <Button
          isLoading={true}
          disabled={false}
          withArrow={true}
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
          onClick={handleClick}
        >
          Conflicted State
        </Button>
      );

      const btn = screen.getByRole("button", { name: /conflicted state/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-busy", "true");

      // Spinner should be visible
      expect(btn.querySelector(".animate-spin")).toBeInTheDocument();

      // Left icon, right icon, and arrow should be suppressed during loading
      expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right-icon")).not.toBeInTheDocument();
      expect(btn.querySelector(".group-hover\\:translate-x-0\\.5")).not.toBeInTheDocument();
    });

    it("renders extremely long text labels gracefully with truncate class", () => {
      const superLongText =
        "A".repeat(500) +
        " Highly Comprehensive Academic Citation Rigor Analysis and Quantitative Empirical Validation Harness";
      render(<Button>{superLongText}</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeInTheDocument();
      const textSpan = btn.querySelector("span.truncate");
      expect(textSpan).toBeInTheDocument();
      expect(textSpan).toHaveTextContent(superLongText);
    });

    it("handles empty / undefined / null children gracefully without crashing", () => {
      const { rerender } = render(<Button>{null}</Button>);
      let btn = screen.getByRole("button");
      expect(btn).toBeInTheDocument();

      rerender(<Button>{undefined}</Button>);
      btn = screen.getByRole("button");
      expect(btn).toBeInTheDocument();

      rerender(<Button />);
      btn = screen.getByRole("button");
      expect(btn).toBeInTheDocument();
    });

    it("gracefully falls back when passed unknown variant or size", () => {
      render(
        <Button
          variant={"unknown-variant" as unknown as React.ComponentProps<typeof Button>["variant"]}
          size={"massive" as unknown as React.ComponentProps<typeof Button>["size"]}
        >
          Fallback Test
        </Button>
      );
      const btn = screen.getByRole("button", { name: /fallback test/i });
      expect(btn).toBeInTheDocument();
      // Should fallback to primary styles and md size
      expect(btn).toHaveClass("bg-[#027e6f]");
      expect(btn).toHaveClass("min-h-[44px]");
    });

    it("forwards ref correctly to allow programmatic focus and DOM inspection", () => {
      const btnRef = createRef<HTMLButtonElement>();
      render(<Button ref={btnRef}>Ref Target</Button>);

      expect(btnRef.current).toBeInstanceOf(HTMLButtonElement);
      expect(btnRef.current?.textContent).toBe("Ref Target");

      btnRef.current?.focus();
      expect(document.activeElement).toBe(btnRef.current);
    });

    it("preserves HTML button attributes like form, type='submit', name, and value", () => {
      render(
        <Button type="submit" name="action" value="verify_citation" data-custom="cite-meta">
          Submit Citation
        </Button>
      );
      const btn = screen.getByRole("button", { name: /submit citation/i });
      expect(btn).toHaveAttribute("type", "submit");
      expect(btn).toHaveAttribute("name", "action");
      expect(btn).toHaveAttribute("value", "verify_citation");
      expect(btn).toHaveAttribute("data-custom", "cite-meta");
    });

    it("rightIcon takes precedence over withArrow to avoid double arrow/icon clutter", () => {
      render(
        <Button withArrow rightIcon={<span data-testid="custom-right">Custom</span>}>
          Priority Test
        </Button>
      );
      expect(screen.getByTestId("custom-right")).toBeInTheDocument();
      // Lucide arrow should not be rendered
      const arrow = screen.getByRole("button").querySelector(".group-hover\\:translate-x-0\\.5");
      expect(arrow).toBeNull();
    });

    it("handles keyboard interaction (Enter / Space firing click handler)", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard Accessible</Button>);
      const btn = screen.getByRole("button", { name: /keyboard accessible/i });

      btn.focus();
      fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. BADGE & TAG COMPONENT STRESS & ADVERSARIAL TESTS
  // =========================================================================
  describe("Badge & Tag: Counter Overflows, Dismiss Event Isolation, Edge Cases", () => {
    it("handles zero (0) as a valid numerical count without falsy truncation", () => {
      render(<Badge count={0}>Zero Issues</Badge>);
      const countEl = screen.getByLabelText("Count: 0");
      expect(countEl).toBeInTheDocument();
      expect(countEl).toHaveTextContent("0");
    });

    it("handles extreme count values (negative, huge numbers, strings like 999+, 1.4k)", () => {
      const { rerender } = render(<Badge count={999999}>Overflow</Badge>);
      expect(screen.getByLabelText("Count: 999999")).toHaveTextContent("999999");

      rerender(<Badge count="999+">Max Cap</Badge>);
      expect(screen.getByLabelText("Count: 999+")).toHaveTextContent("999+");

      rerender(<Badge count="-5">Negative Diff</Badge>);
      expect(screen.getByLabelText("Count: -5")).toHaveTextContent("-5");
    });

    it("isolates dismiss button click from parent badge/container click (stopPropagation)", () => {
      const parentClick = vi.fn();
      const dismissClick = vi.fn();

      render(
        <div onClick={parentClick} data-testid="parent-wrapper">
          <Badge interactive onDismiss={dismissClick} onClick={parentClick}>
            Dismissable Pill
          </Badge>
        </div>
      );

      const dismissBtn = screen.getByRole("button", { name: /dismiss tag/i });
      fireEvent.click(dismissBtn);

      expect(dismissClick).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });

    it("renders both leading dot and custom icon simultaneously without layout clash", () => {
      const { container } = render(
        <Badge
          dot
          icon={<span data-testid="badge-icon">★</span>}
          variant="outdated-reference"
        >
          Multi-Indicator
        </Badge>
      );

      expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
      const dot = container.querySelector(".rounded-\\[4px\\]");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("bg-[#5b21b6]");
    });

    it("handles unknown variant and size fallbacks gracefully", () => {
      const { container } = render(
        <Badge
          variant={"unknown-color" as unknown as React.ComponentProps<typeof Badge>["variant"]}
          size={"enormous" as unknown as React.ComponentProps<typeof Badge>["size"]}
        >
          Fallback Badge
        </Badge>
      );
      const badge = container.firstElementChild;
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-[#e6f4f2]"); // Fallback to teal
      expect(badge).toHaveClass("h-[28px]"); // Fallback to md
      expect(badge).toHaveClass("rounded-[8px]");
    });

    it("renders empty or whitespace-only children without crashing", () => {
      const { container, rerender } = render(<Badge>{null}</Badge>);
      expect(container.firstElementChild).toBeInTheDocument();

      rerender(<Badge count={3}>{undefined}</Badge>);
      expect(container.firstElementChild).toBeInTheDocument();
      expect(screen.getByLabelText("Count: 3")).toBeInTheDocument();
    });

    it("applies fontMono and uppercase formatting modifiers", () => {
      const { container } = render(
        <Badge fontMono uppercase variant="claim-needs-source">
          doi:10.1038/nature1234
        </Badge>
      );
      const badge = container.firstElementChild;
      expect(badge).toHaveClass("font-mono");
      expect(badge).toHaveClass("uppercase");
      expect(badge).toHaveClass("tracking-wider");
    });

    it("Tag alias preserves full Badge functionality including onDismiss, count, and dot", () => {
      const handleDismiss = vi.fn();
      render(
        <Tag dot count="42" onDismiss={handleDismiss} variant="error">
          Retraction Alert
        </Tag>
      );
      expect(screen.getByText("Retraction Alert")).toBeInTheDocument();
      expect(screen.getByLabelText("Count: 42")).toBeInTheDocument();
      const dismissBtn = screen.getByRole("button", { name: /dismiss tag/i });
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 3. CONTAINER, SECTION & CARD POLYMORPHIC & LAYOUT STRESS TESTS
  // =========================================================================
  describe("Layout Components: Polymorphic Rendering and Max Width Hierarchy", () => {
    it("Container renders polymorphic tags: section, main, article, header, footer, aside, nav", () => {
      const tags = ["section", "main", "article", "header", "footer", "aside", "nav"] as const;

      tags.forEach((tagName) => {
        const { unmount } = render(
          <Container as={tagName} data-testid={`container-${tagName}`}>
            {tagName} content
          </Container>
        );
        const el = screen.getByTestId(`container-${tagName}`);
        expect(el.tagName.toLowerCase()).toBe(tagName);
        expect(el).toHaveClass("max-w-[1200px]");
        expect(el).toHaveClass("mx-auto");
        unmount();
      });
    });

    it("Container handles all size modes including 'full' and unknown fallback", () => {
      const { rerender } = render(<Container size="full" data-testid="cont">Full</Container>);
      let el = screen.getByTestId("cont");
      expect(el).toHaveClass("max-w-full");

      rerender(
        <Container
          size={"unknown" as unknown as React.ComponentProps<typeof Container>["size"]}
          data-testid="cont"
        >
          Unknown
        </Container>
      );
      el = screen.getByTestId("cont");
      expect(el).toHaveClass("max-w-[1200px]");
    });

    it("Section renders polymorphic element types and all variant styles", () => {
      const variants = ["paper", "cloud", "midnight", "ink", "teal", "bordered"] as const;

      variants.forEach((variant) => {
        const { unmount } = render(
          <Section as="main" variant={variant} data-testid={`sec-${variant}`}>
            Section {variant}
          </Section>
        );
        const el = screen.getByTestId(`sec-${variant}`);
        expect(el.tagName).toBe("MAIN");
        expect(el).toBeInTheDocument();
        unmount();
      });
    });

    it("Section handles noContainer={true} and custom spacing modes", () => {
      const { rerender } = render(
        <Section spacing="hero" noContainer data-testid="sec-hero">
          Raw Direct Child Content
        </Section>
      );
      const section = screen.getByTestId("sec-hero");
      expect(section).toHaveClass("pt-16");
      expect(section).toHaveClass("lg:pt-32");
      // Because noContainer is true, there is no inner 1200px wrapper div
      expect(section.querySelector(".max-w-\\[1200px\\]")).toBeNull();

      rerender(
        <Section spacing="none" noContainer={false} containerSize="narrow" data-testid="sec-hero">
          Nested Narrow
        </Section>
      );
      expect(section.querySelector(".max-w-\\[800px\\]")).toBeInTheDocument();
    });

    it("Card renders polymorphic tags, 8px radius standard, and all padding/variant modes", () => {
      const { rerender } = render(
        <Card as="article" variant="interactive" padding="lg" data-testid="card-stress">
          Article Card
        </Card>
      );
      let card = screen.getByTestId("card-stress");
      expect(card.tagName).toBe("ARTICLE");
      expect(card).toHaveClass("rounded-[8px]");
      expect(card).toHaveClass("shadow-none");
      expect(card).toHaveClass("p-8");
      expect(card).toHaveClass("cursor-pointer");

      rerender(
        <Card as="section" variant="teal" padding="none" data-testid="card-stress">
          Teal Section Card
        </Card>
      );
      card = screen.getByTestId("card-stress");
      expect(card.tagName).toBe("SECTION");
      expect(card).toHaveClass("bg-[#02665a]");
      expect(card).toHaveClass("p-0");
    });
  });
});
