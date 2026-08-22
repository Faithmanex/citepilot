// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InteractiveDemoEditor } from "../InteractiveDemoEditor";

describe("Demo Suggestion End-to-End User Flows (DemoSuggestionFlow)", () => {
  afterEach(() => {
    cleanup();
  });

  it("executes full interactive flow: inspect span -> accept fix -> text inline mutation -> score rise -> 100% completion", () => {
    render(<InteractiveDemoEditor defaultDraftId="lit-review" />);

    // Initially at 64%
    expect(screen.getByText("64%")).toBeInTheDocument();
    expect(screen.getByText("Needs Immediate Attention")).toBeInTheDocument();

    // 1. Resolve lit-1
    const lit1 = screen.getByTestId("highlight-lit-1");
    fireEvent.click(lit1);

    expect(screen.getByText("Unattributed Architectural Claim")).toBeInTheDocument();
    const acceptBtn1 = screen.getByRole("button", { name: /accept fix/i });
    fireEvent.click(acceptBtn1);

    // Score increases
    expect(screen.queryByText("64%")).not.toBeInTheDocument();
    expect(screen.getByText(/Shazeer, 2019/i)).toBeInTheDocument();

    // 2. Resolve lit-2
    const lit2 = screen.getByTestId("highlight-lit-2");
    fireEvent.click(lit2);
    fireEvent.click(screen.getByRole("button", { name: /accept fix/i }));

    // 3. Resolve lit-3
    const lit3 = screen.getByTestId("highlight-lit-3");
    fireEvent.click(lit3);
    fireEvent.click(screen.getByRole("button", { name: /accept fix/i }));

    // 4. Resolve lit-4
    const lit4 = screen.getByTestId("highlight-lit-4");
    fireEvent.click(lit4);
    fireEvent.click(screen.getByRole("button", { name: /accept fix/i }));

    // Reaches 100% Ready for Submission
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Ready for Journal Submission")).toBeInTheDocument();
  });

  it("executes dismissal flow: inspect span -> dismiss -> highlight removed -> text preserved -> reset restored", () => {
    render(<InteractiveDemoEditor defaultDraftId="intro" />);

    // Click on bio-1 span
    const bio1 = screen.getByTestId("highlight-bio-1");
    fireEvent.click(bio1);

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    // Span highlight is cleared
    expect(screen.queryByTestId("highlight-bio-1")).not.toBeInTheDocument();

    // Reset button should now be active
    const resetBtn = screen.getByRole("button", { name: /reset/i });
    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);

    // Span restored
    expect(screen.getByTestId("highlight-bio-1")).toBeInTheDocument();
  });

  it("executes custom draft live typing workflow", () => {
    render(<InteractiveDemoEditor defaultDraftId="custom" />);

    const customTab = screen.getByRole("tab", { name: /custom draft/i });
    expect(customTab).toHaveAttribute("aria-selected", "true");

    const textarea = screen.getByTestId("custom-manuscript-textarea");
    fireEvent.change(textarea, {
      target: {
        value: "The experimental protocol obviously proves beyond doubt that off-target rates reduce by 42.5%.",
      },
    });

    // Highlights should appear in live audit preview
    const highlightSpans = screen.getAllByRole("button", { name: /citation issue:/i });
    expect(highlightSpans.length).toBeGreaterThan(0);

    // Click and accept first suggestion
    fireEvent.click(highlightSpans[0]);
    const acceptBtn = screen.getByRole("button", { name: /accept fix/i });
    fireEvent.click(acceptBtn);

    expect(screen.getByTestId("demo-manuscript-canvas")).toBeInTheDocument();
  });
});
