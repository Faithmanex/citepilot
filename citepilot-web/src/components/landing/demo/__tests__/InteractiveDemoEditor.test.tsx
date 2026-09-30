// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InteractiveDemoEditor } from "../InteractiveDemoEditor";
import { DEMO_EXAMPLES } from "../examples";

describe("InteractiveDemoEditor (production-mirrored demo)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the same surface the dashboard uses: canvas, findings summary, findings list", () => {
    render(<InteractiveDemoEditor />);

    expect(screen.getByTestId("interactive-demo-editor")).toBeInTheDocument();
    expect(screen.getByTestId("document-editor-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("findings-summary")).toBeInTheDocument();
    expect(screen.getByTestId("live-suggestion-feed")).toBeInTheDocument();
    expect(screen.getByTestId("highlight-span-seq-citation")).toBeInTheDocument();
  });

  it("makes no unverifiable verification or DOI claims", () => {
    const { container } = render(<InteractiveDemoEditor />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/crossref verified/i);
    expect(text).not.toMatch(/\bdoi:/i);
    expect(text).not.toMatch(/rigor score/i);
  });

  it("applies a one-click fix through the production mutation engine", () => {
    render(<InteractiveDemoEditor />);

    fireEvent.click(screen.getByTestId("highlight-span-seq-style"));
    const accept = screen.getByTestId("accept-suggestion-button");
    fireEvent.click(accept);

    expect(
      screen.getByTestId("interactive-manuscript-canvas").textContent
    ).toContain("(Vaswani et al., 2017)");
  });

  it("switches between worked examples", () => {
    render(<InteractiveDemoEditor />);

    expect(screen.getByTestId("highlight-span-seq-citation")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("demo-example-patient-adherence"));

    expect(screen.getByTestId("highlight-span-adh-citation")).toBeInTheDocument();
    expect(screen.queryByTestId("highlight-span-seq-citation")).toBeNull();
  });

  it("ships only internal-consistency findings (no fabricated reference metadata)", () => {
    for (const example of DEMO_EXAMPLES) {
      for (const suggestion of example.suggestions) {
        expect(suggestion.metadata).toBeUndefined();
        expect(suggestion.status).toBe("active");
      }
    }
  });
});
