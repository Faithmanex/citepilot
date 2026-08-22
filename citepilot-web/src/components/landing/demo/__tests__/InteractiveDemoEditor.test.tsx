// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InteractiveDemoEditor } from "../InteractiveDemoEditor";

describe("InteractiveDemoEditor Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the 1200px max-width container with 8px radius standard and zero drop shadows", () => {
    const { container } = render(<InteractiveDemoEditor />);
    const section = screen.getByTestId("interactive-demo-editor");
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass("max-w-[1200px]");

    const card = container.querySelector(".bg-\\[\\#ffffff\\].border");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("shadow-none");
    expect(card).toHaveClass("border-[#d9d9d9]");
  });

  it("renders all four primary UI subsystems (Selector, Surface, Score Counter, Suggestion Card)", () => {
    render(<InteractiveDemoEditor />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByTestId("demo-editor-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("demo-score-counter")).toBeInTheDocument();
    expect(screen.getByTestId("suggestion-card-empty")).toBeInTheDocument();
  });

  it("switches drafts when tabs are clicked and fires onDraftChange callback", () => {
    const handleDraftChange = vi.fn();
    render(<InteractiveDemoEditor onDraftChange={handleDraftChange} />);

    const introTab = screen.getByRole("tab", { name: /introduction/i });
    fireEvent.click(introTab);

    expect(handleDraftChange).toHaveBeenCalledWith("intro");
    expect(screen.getByText(/programmable RNA-guided endonucleases/i)).toBeInTheDocument();
  });

  it("updates score and surfaces suggestion card upon clicking an inline highlight span", () => {
    const handleScoreChange = vi.fn();
    render(<InteractiveDemoEditor onScoreChange={handleScoreChange} />);

    // Initial score callback
    expect(handleScoreChange).toHaveBeenCalled();

    // Click on lit-1 span
    const lit1Span = screen.getByTestId("highlight-lit-1");
    fireEvent.click(lit1Span);

    expect(screen.getByTestId("demo-suggestion-card")).toBeInTheDocument();
    expect(screen.getByText("Unattributed Architectural Claim")).toBeInTheDocument();

    // Click Accept Fix
    const acceptBtn = screen.getByRole("button", { name: /accept fix/i });
    fireEvent.click(acceptBtn);

    // Text in editor should now contain citation
    expect(screen.getByText(/Shazeer, 2019/i)).toBeInTheDocument();
  });
});
