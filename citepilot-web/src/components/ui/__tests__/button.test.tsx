// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Button } from "../button";

describe("Grammarly Editorial Button Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with default props (primary variant, md size, 8px radius, zero shadows)", () => {
    render(<Button>Get CitePilot</Button>);
    const button = screen.getByRole("button", { name: /get citepilot/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-[#027e6f]");
    expect(button).toHaveClass("rounded-lg");
    expect(button).toHaveClass("shadow-none");
    expect(button).toHaveClass("min-h-[44px]");
  });

  it("renders secondary dark outlined variant correctly", () => {
    render(<Button variant="secondary">Try Interactive Demo</Button>);
    const button = screen.getByRole("button", { name: /try interactive demo/i });
    expect(button).toHaveClass("border-[#0e101a]");
    expect(button).toHaveClass("text-[#0e101a]");
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("rounded-lg");
    expect(button).toHaveClass("shadow-none");
  });

  it("renders ghost white outlined variant correctly", () => {
    render(<Button variant="ghost-white">Contact Sales</Button>);
    const button = screen.getByRole("button", { name: /contact sales/i });
    expect(button).toHaveClass("border-white/80");
    expect(button).toHaveClass("text-white");
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("rounded-lg");
  });

  it("renders subdued ghost variant correctly", () => {
    render(<Button variant="subdued">Log in</Button>);
    const button = screen.getByRole("button", { name: /log in/i });
    expect(button).toHaveClass("text-[#545454]");
    expect(button).toHaveClass("border-transparent");
    expect(button).toHaveClass("rounded-lg");
  });

  it("renders all size variants (sm, md, lg)", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let btn = screen.getByRole("button", { name: /small/i });
    expect(btn).toHaveClass("h-9");
    expect(btn).toHaveClass("text-[13px]");

    rerender(<Button size="md">Medium</Button>);
    btn = screen.getByRole("button", { name: /medium/i });
    expect(btn).toHaveClass("h-11");
    expect(btn).toHaveClass("min-h-[44px]");

    rerender(<Button size="lg">Large</Button>);
    btn = screen.getByRole("button", { name: /large/i });
    expect(btn).toHaveClass("h-[52px]");
    expect(btn).toHaveClass("text-[16px]");
  });

  it("renders right arrow icon when withArrow is true", () => {
    const { container } = render(<Button withArrow>Get Started</Button>);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("group-hover:translate-x-0.5");
  });

  it("handles loading state correctly (shows spinner, disables button, sets aria-busy)", () => {
    render(<Button isLoading>Submitting</Button>);
    const button = screen.getByRole("button", { name: /submitting/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("handles user click events when enabled", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prevents user click events when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports fullWidth prop", () => {
    render(<Button fullWidth>Full Width CTA</Button>);
    const button = screen.getByRole("button", { name: /full width cta/i });
    expect(button).toHaveClass("w-full");
  });

  it("renders custom left and right icons", () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        With Icons
      </Button>
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });
});
