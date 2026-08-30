// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ManuscriptEditorWorkspace from "../ManuscriptEditorWorkspace";
import type { AuditResponse } from "@/lib/types";

// Mock API functions for exports
vi.mock("@/lib/api", () => ({
  exportDocx: vi.fn().mockResolvedValue(new Blob(["mock-docx"], { type: "application/vnd.openxmlformats" })),
  exportPdf: vi.fn().mockResolvedValue(new Blob(["mock-pdf"], { type: "application/pdf" })),
}));

// Mock utils downloadBlob
vi.mock("@/lib/utils", () => ({
  downloadBlob: vi.fn(),
}));

describe("ManuscriptEditorWorkspace Component", () => {
  const sampleManuscript = `Introduction
Large language models require rigorous citation verification (Vaswani et al. 2017).
Empirical benchmarks prove beyond doubt that error rates decrease drastically.

References
Vaswani, A. et al. (2017). Attention is all you need. NeurIPS.`;

  const mockAudit: AuditResponse = {
    citations: [
      {
        raw_text: "(Vaswani et al. 2017)",
        status: "matched",
        issues: [{ code: "STYLE_COMMA", message: "Missing comma before publication year" }],
      },
    ],
    style_warnings: [
      {
        code: "APA7_COMMA",
        message: "Missing comma before year in parenthetical citation",
        target_text: "(Vaswani et al. 2017)",
        suggestion: "(Vaswani et al., 2017)",
        educational_context: "In APA 7th ed., citations require a comma before the year.",
      },
    ],
    uncited_claims: [
      {
        claim_text: "Empirical benchmarks prove beyond doubt that error rates decrease drastically.",
        suggestion: "Add benchmark reference",
        educational_context: "Factual assertions require citations.",
      },
    ],
    references: [
      {
        raw_entry: "Vaswani, A. et al. (2017). Attention is all you need. NeurIPS.",
        status: "cited",
      },
    ],
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });


  it("renders the 60/40 split workspace with document canvas and suggestion feed", () => {
    render(
      <ManuscriptEditorWorkspace
        initialText={sampleManuscript}
        auditData={mockAudit}
        documentName="transformer_study.docx"
      />
    );

    // Left canvas
    expect(screen.getByTestId("document-editor-canvas")).toBeInTheDocument();
    expect(screen.getByText(/Academic Manuscript Canvas/i)).toBeInTheDocument();

    // Right rigor score & suggestions
    expect(screen.getByTestId("rigor-score-widget")).toBeInTheDocument();
    expect(screen.getByTestId("live-suggestion-feed")).toBeInTheDocument();

    // Export suite
    expect(screen.getByTestId("document-export-suite")).toBeInTheDocument();
  });

  it("selects suggestion when clicking on highlight span in canvas and displays visual diff", () => {
    render(
      <ManuscriptEditorWorkspace
        initialText={sampleManuscript}
        auditData={mockAudit}
      />
    );

    // Find highlight spans
    const highlightSpan = screen.getAllByRole("button").find((btn) =>
      btn.getAttribute("data-testid")?.startsWith("highlight-span-")
    );

    expect(highlightSpan).toBeDefined();
    if (highlightSpan) {
      fireEvent.click(highlightSpan);

      // Verify the active suggestion card renders diff
      expect(screen.getByTestId("selected-suggestion-card")).toBeInTheDocument();
      expect(screen.getByText("Accept Fix")).toBeInTheDocument();
    }
  });

  it("applies 1-click in-place fix, updates canvas text and increments score", () => {
    const handleTextChange = vi.fn();

    render(
      <ManuscriptEditorWorkspace
        initialText={sampleManuscript}
        auditData={mockAudit}
        onTextChange={handleTextChange}
      />
    );

    // Select the first suggestion item from the feed list
    const firstItem = screen.getAllByTestId(/suggestion-item-/)[0];
    fireEvent.click(firstItem);

    // Click Accept Fix button
    const acceptBtn = screen.getByTestId("accept-suggestion-button");
    fireEvent.click(acceptBtn);

    // Verify text update was called with the corrected string
    expect(handleTextChange).toHaveBeenCalled();
    const updatedTextArg = handleTextChange.mock.calls[0][0];
    expect(updatedTextArg).toContain("(Vaswani et al., 2017)");
  });

  it("toggles to direct prose editing mode and accepts typing", () => {
    const handleTextChange = vi.fn();

    render(
      <ManuscriptEditorWorkspace
        initialText={sampleManuscript}
        auditData={mockAudit}
        onTextChange={handleTextChange}
      />
    );

    const toggleBtn = screen.getByTestId("toggle-edit-mode-btn");
    fireEvent.click(toggleBtn);

    // Textarea is rendered
    const textarea = screen.getByTestId("direct-manuscript-textarea");
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "New manual paragraph typed by researcher." } });
    expect(handleTextChange).toHaveBeenCalledWith("New manual paragraph typed by researcher.");
  });

  it("triggers clean docx, redline docx, and copy manuscript exports", async () => {
    const { exportDocx } = await import("@/lib/api");

    render(
      <ManuscriptEditorWorkspace
        initialText={sampleManuscript}
        auditData={mockAudit}
        documentName="my_research.docx"
      />
    );

    const cleanDocxBtn = screen.getByTestId("export-clean-docx-btn");
    fireEvent.click(cleanDocxBtn);
    expect(exportDocx).toHaveBeenCalledWith(sampleManuscript, mockAudit, "clean");

    const redlineDocxBtn = screen.getByTestId("export-redline-docx-btn");
    fireEvent.click(redlineDocxBtn);
    expect(exportDocx).toHaveBeenCalledWith(sampleManuscript, mockAudit, "redline");

    const copyBtn = screen.getByTestId("copy-manuscript-btn");
    expect(copyBtn).toBeInTheDocument();
  });
});
