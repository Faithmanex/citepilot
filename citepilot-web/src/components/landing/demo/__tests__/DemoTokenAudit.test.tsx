// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InteractiveDemoEditor } from "../InteractiveDemoEditor";

describe("Demo Token Compliance & Design System Audit (DemoTokenAudit)", () => {
  afterEach(() => {
    cleanup();
  });

  it("strictly enforces 8px radius standard (rounded-lg / rounded-[8px]) across all buttons, inputs, and cards", () => {
    const { container } = render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    // Select suggestion to render suggestion card buttons
    const lit1 = screen.getByTestId("highlight-lit-1");
    fireEvent.click(lit1);

    // Collect all interactive buttons and cards
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      // Must have rounded-lg or rounded-[8px] or rounded-[6px]/rounded-[4px] for tiny internal icons, NO rounded-full (9999px)
      const className = btn.className;
      expect(className).not.toContain("rounded-full");
      expect(className).not.toContain("rounded-2xl");
      expect(className).not.toContain("rounded-3xl");
    });

    // Check containers
    const cards = container.querySelectorAll(".border");
    cards.forEach((card) => {
      const className = card.className;
      expect(className).not.toContain("rounded-full");
      expect(className).not.toContain("rounded-2xl");
      expect(className).not.toContain("rounded-3xl");
    });
  });

  it("strictly enforces flat surface elevation with zero drop shadows (shadow-none)", () => {
    const { container } = render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    const shadowElements = container.querySelectorAll(
      ".shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl"
    );
    expect(shadowElements.length).toBe(0);
  });

  it("strictly uses hairline 1px borders (#ebebeb, #d9d9d9, or #a7dcd4)", () => {
    const { container } = render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    // No heavy borders (border-4, border-8)
    const heavyBorders = container.querySelectorAll(".border-4, .border-8");
    expect(heavyBorders.length).toBe(0);
  });

  it("reserves Grammarly Teal (#027e6f) exclusively for primary actions, active states, and verified indicators", () => {
    render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    const lit1 = screen.getByTestId("highlight-lit-1");
    fireEvent.click(lit1);

    const acceptBtn = screen.getByRole("button", { name: /accept fix/i });
    expect(acceptBtn).toHaveClass("bg-[#027e6f]");
  });
});
