// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Badge } from "../badge";
import { Tag } from "../tag";

describe("Grammarly Editorial Badge & Tag Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with default props (teal variant, md size, 8px radius, zero shadows)", () => {
    const { container } = render(<Badge>Missing Citation</Badge>);
    const badge = container.firstElementChild;
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-[#e6f4f2]");
    expect(badge).toHaveClass("text-[#027e6f]");
    expect(badge).toHaveClass("border-[#a7dcd4]");
    expect(badge).toHaveClass("rounded-[8px]");
    expect(badge).toHaveClass("shadow-none");
    expect(badge).toHaveTextContent("Missing Citation");
  });

  it("renders all 4 citation audit category colorways correctly", () => {
    // 1. Missing Citation (Teal)
    const { container, rerender } = render(<Badge variant="missing-citation">Missing Citation</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#e6f4f2]");
    expect(badge).toHaveClass("text-[#027e6f]");
    expect(badge).toHaveClass("border-[#a7dcd4]");

    // 2. Claim Needs Source (Amber)
    rerender(<Badge variant="claim-needs-source">Claim Needs Source</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#fef3c7]");
    expect(badge).toHaveClass("text-[#92400e]");
    expect(badge).toHaveClass("border-[#fde68a]");

    // 3. Outdated Reference (Violet)
    rerender(<Badge variant="outdated-reference">Outdated Reference</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#ede9fe]");
    expect(badge).toHaveClass("text-[#5b21b6]");
    expect(badge).toHaveClass("border-[#ddd6fe]");

    // 4. Tone & Clarity (Slate)
    rerender(<Badge variant="tone-clarity">Tone & Clarity</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#f5f5f5]");
    expect(badge).toHaveClass("text-[#1f243c]");
    expect(badge).toHaveClass("border-[#d9d9d9]");
  });

  it("renders error and info variants", () => {
    const { container, rerender } = render(<Badge variant="error">Retracted DOI</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#fee2e2]");
    expect(badge).toHaveClass("text-[#b91c1c]");

    rerender(<Badge variant="info">APA 7th Edition</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#eff6ff]");
    expect(badge).toHaveClass("text-[#2563eb]");
  });

  it("renders dark and outline variants", () => {
    const { container, rerender } = render(<Badge variant="dark">Dark Chip</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("text-white");

    rerender(<Badge variant="outline">Achromatic</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-[#0e101a]");
  });

  it("renders size scales (sm, md, lg) with 8px radius standard", () => {
    const { container, rerender } = render(<Badge size="sm">Small Tag</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("h-[22px]");
    expect(badge).toHaveClass("rounded-[8px]");

    rerender(<Badge size="md">Medium Tag</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("h-[28px]");
    expect(badge).toHaveClass("rounded-[8px]");

    rerender(<Badge size="lg">Large Tag</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("h-[34px]");
    expect(badge).toHaveClass("rounded-[8px]");
  });

  it("renders leading status dot when dot is true", () => {
    const { container } = render(<Badge dot variant="missing-citation">Verified</Badge>);
    const dot = container.querySelector(".rounded-\\[4px\\]");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-[#027e6f]");
  });

  it("renders leading icon", () => {
    render(<Badge icon={<span data-testid="icon">★</span>}>Starred</Badge>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders count bubble", () => {
    render(<Badge count={5}>Suggestions</Badge>);
    expect(screen.getByLabelText("Count: 5")).toHaveTextContent("5");
  });

  it("handles dismiss action button and callback", () => {
    const handleDismiss = vi.fn();
    render(<Badge onDismiss={handleDismiss}>Dismissable</Badge>);
    const dismissBtn = screen.getByRole("button", { name: /dismiss tag/i });
    expect(dismissBtn).toBeInTheDocument();
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("works seamlessly when rendered via Tag alias", () => {
    const { container } = render(<Tag variant="claim-needs-source">Tag Alias</Tag>);
    const tag = container.firstElementChild;
    expect(tag).toHaveClass("bg-[#fef3c7]");
    expect(tag).toHaveClass("rounded-[8px]");
  });
});
