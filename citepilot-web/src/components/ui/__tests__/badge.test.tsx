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
    expect(badge).toHaveClass("bg-[#e7e9f5]");
    expect(badge).toHaveClass("text-[#2c3e8c]");
    expect(badge).toHaveClass("border-[#c9cee8]");
    expect(badge).toHaveClass("rounded-[8px]");
    expect(badge).toHaveClass("shadow-none");
    expect(badge).toHaveTextContent("Missing Citation");
  });

  it("renders all 4 citation audit category colorways correctly", () => {
    // 1. Missing Citation (Teal)
    const { container, rerender } = render(<Badge variant="missing-citation">Missing Citation</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#e7e9f5]");
    expect(badge).toHaveClass("text-[#2c3e8c]");
    expect(badge).toHaveClass("border-[#c9cee8]");

    // 2. Claim Needs Source (Amber)
    rerender(<Badge variant="claim-needs-source">Claim Needs Source</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#f1e4c8]");
    expect(badge).toHaveClass("text-[#93650f]");
    expect(badge).toHaveClass("border-[#ecd9a8]");

    // 3. Outdated Reference (Violet)
    rerender(<Badge variant="outdated-reference">Outdated Reference</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#f1e4c8]");
    expect(badge).toHaveClass("text-[#93650f]");
    expect(badge).toHaveClass("border-[#ecd9a8]");

    // 4. Tone & Clarity (Slate)
    rerender(<Badge variant="tone-clarity">Tone & Clarity</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#faf6ec]");
    expect(badge).toHaveClass("text-[#14181f]");
    expect(badge).toHaveClass("border-[#d9cfb8]");
  });

  it("renders error and info variants", () => {
    const { container, rerender } = render(<Badge variant="error">Retracted DOI</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#f3dcd6]");
    expect(badge).toHaveClass("text-[#a32b21]");

    rerender(<Badge variant="info">APA 7th Edition</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-[#e7e9f5]");
    expect(badge).toHaveClass("text-[#2c3e8c]");
  });

  it("renders dark and outline variants", () => {
    const { container, rerender } = render(<Badge variant="dark">Dark Chip</Badge>);
    let badge = container.firstElementChild;
    expect(badge).toHaveClass("text-white");

    rerender(<Badge variant="outline">Achromatic</Badge>);
    badge = container.firstElementChild;
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-[#221d16]");
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
    expect(dot).toHaveClass("bg-[#2c3e8c]");
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
    expect(tag).toHaveClass("bg-[#f1e4c8]");
    expect(tag).toHaveClass("rounded-[8px]");
  });
});
