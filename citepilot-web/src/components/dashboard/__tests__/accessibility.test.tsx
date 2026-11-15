// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Modal from "@/components/ui/Modal";
import InputArea from "../InputArea";
import { FindingsSummaryWidget } from "../editor/RigorScoreWidget";
import { DocumentExportSuite } from "../editor/DocumentExportSuite";
import type { AuditSummary } from "@/lib/auditState";
import type { AuditResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  exportDocx: vi.fn().mockResolvedValue(new Blob(["docx"])),
  exportPdf: vi.fn().mockResolvedValue(new Blob(["pdf"])),
}));
vi.mock("@/lib/utils", () => ({ downloadBlob: vi.fn() }));

const READY: AuditSummary = {
  phase: "ready",
  freshness: "none",
  headline: "Ready to audit",
  description: "This document has not been audited yet.",
  tone: "neutral",
  showsResult: false,
  isClean: false,
  incompleteChecks: [],
};

const COMPLETED: AuditSummary = {
  phase: "completed",
  freshness: "current",
  headline: "Audit completed",
  description: "Every requested check completed for this revision.",
  tone: "success",
  showsResult: true,
  isClean: true,
  incompleteChecks: [],
};

const PARTIAL: AuditSummary = {
  phase: "completed",
  freshness: "current",
  headline: "Audit completed with unavailable checks",
  description: "Some checks could not complete.",
  tone: "warning",
  showsResult: true,
  isClean: false,
  incompleteChecks: [
    {
      name: "verification",
      label: "Crossref / OpenAlex verification",
      status: "unavailable",
      message: "Verification timed out.",
    },
  ],
};

const EMPTY_SUMMARY = { total: 0, active: 0, resolved: 0, byCategory: { citation: 0, style: 0, claim: 0, reference: 0 } };
const EMPTY_RESULT: AuditResponse = { citations: [], references: [], style_warnings: [], uncited_claims: [] };

describe("accessible modal", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("moves focus in, traps Tab, closes on Escape, and restores focus", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open dialog</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Test dialog">
            <button>First</button>
            <button>Last</button>
          </Modal>
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Test dialog" });
    expect(dialog).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "First" })).toHaveFocus());

    // Tab from the last control wraps to the close affordance.
    screen.getByRole("button", { name: "Last" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();

    // Shift+Tab from the first control in the tab order wraps to the last.
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("names the dialog and describes it when a description is provided", () => {
    render(
      <Modal open onClose={() => {}} title="Delete item" description="This cannot be undone.">
        <button>Cancel</button>
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });
});

describe("accessible document input", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  function Harness({ initial = "" }: { initial?: string }) {
    const [text, setText] = useState(initial);
    return (
      <InputArea
        text={text}
        fileName={null}
        onFileSelect={vi.fn()}
        onTextChange={setText}
        onClear={() => setText("")}
      />
    );
  }

  it("exposes the upload control as a keyboard-operable button", () => {
    render(<Harness />);
    const upload = screen.getByRole("button", { name: /choose a file to upload/i });
    expect(upload).toBeInTheDocument();

    const input = document.getElementById("manuscript-file") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.keyDown(upload, { key: "Enter" });
    fireEvent.click(upload);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("gives the textarea a persistent label and instructions", () => {
    render(<Harness />);
    const textarea = screen.getByRole("textbox", {
      name: /paste manuscript text or a reference list/i,
    });
    expect(textarea).toHaveAttribute("aria-describedby");
    expect(screen.getByText(/DOCX, PDF, TXT, RTF, or BibTeX/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 10 MB/i)).toBeInTheDocument();
  });

  it("keeps every character typed one at a time and never remounts the textarea", () => {
    render(<Harness />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const originalNode = textarea;

    let value = "";
    for (const ch of "Hello") {
      value += ch;
      fireEvent.change(textarea, { target: { value } });
      expect(screen.getByRole("textbox")).toBe(originalNode);
    }
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Hello");
  });

  it("retains a multiline paste intact", () => {
    render(<Harness />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const pasted = "First paragraph.\n\nSecond paragraph.\nThird line.";
    fireEvent.change(textarea, { target: { value: pasted } });
    expect(textarea.value).toBe(pasted);
  });

  it("announces unsupported and empty files without calling the handler", () => {
    const onFileSelect = vi.fn();
    render(
      <InputArea
        text=""
        fileName={null}
        onFileSelect={onFileSelect}
        onTextChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    const input = document.getElementById("manuscript-file") as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [{ name: "legacy.doc", size: 10 }] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/not supported/i);
    expect(onFileSelect).not.toHaveBeenCalled();

    fireEvent.change(input, {
      target: { files: [{ name: "empty.docx", size: 0 }] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/empty/i);
    expect(onFileSelect).not.toHaveBeenCalled();

    fireEvent.change(input, {
      target: { files: [{ name: "ok.docx", size: 10 }] },
    });
    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect.mock.calls[0][0].name).toBe("ok.docx");
  });
});

describe("audit-state-aware findings summary", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("shows 'Ready to audit' — never 'Nothing flagged' — before a run", () => {
    render(<FindingsSummaryWidget summary={EMPTY_SUMMARY} audit={READY} />);
    expect(screen.getByTestId("findings-summary-headline")).toHaveTextContent("Ready to audit");
    expect(screen.queryByText("Nothing flagged")).not.toBeInTheDocument();
  });

  it("reserves 'Nothing flagged' for a completed audit with zero findings", () => {
    render(<FindingsSummaryWidget summary={EMPTY_SUMMARY} audit={COMPLETED} />);
    expect(screen.getByTestId("findings-summary-headline")).toHaveTextContent("Nothing flagged");
  });

  it("discloses unavailable checks instead of implying the document is clean", () => {
    render(<FindingsSummaryWidget summary={EMPTY_SUMMARY} audit={PARTIAL} />);
    expect(screen.queryByText("Nothing flagged")).not.toBeInTheDocument();
    expect(screen.getByText(/Checks that could not complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Verification timed out/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Missing findings for these checks do not mean the document is clean/i)
    ).toBeInTheDocument();
  });

  it("qualifies finding counts and marks categories whose checks did not run", () => {
    const partialAudit: AuditSummary = {
      ...PARTIAL,
      incompleteChecks: [
        { name: "citations", label: "In-text citation extraction", status: "unavailable" },
        { name: "style", label: "Citation style checking", status: "unavailable" },
        { name: "references", label: "Reference list parsing", status: "unavailable" },
      ],
    };
    const summary = {
      total: 1,
      active: 1,
      resolved: 0,
      byCategory: { citation: 0, style: 0, claim: 1, reference: 0 },
    };

    render(<FindingsSummaryWidget summary={summary} audit={partialAudit} />);

    // The count is explicitly limited to checks that actually ran.
    expect(screen.getByTestId("findings-summary-headline")).toHaveTextContent(
      "1 open finding so far"
    );
    expect(screen.getByText(/detected by completed checks/i)).toBeInTheDocument();
    expect(screen.getByText(/3 checks could not complete/i)).toBeInTheDocument();

    // Categories backed by unavailable checks must not display a fake zero.
    expect(screen.getAllByText("not checked")).toHaveLength(3);
    const claimRow = screen.getByText("Uncited claims").closest("div");
    expect(claimRow).toHaveTextContent("1");
  });
});

describe("export availability", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it("explains why audit exports are unavailable before an audit", () => {
    render(
      <DocumentExportSuite
        data={null}
        audit={READY}
        manuscriptText="Some manuscript text."
        documentName="paper.docx"
      />
    );

    expect(screen.getByTestId("export-clean-docx-btn")).toBeEnabled();
    expect(screen.getByTestId("export-redline-docx-btn")).toBeDisabled();
    expect(screen.getByTestId("export-pdf-report-btn")).toBeDisabled();
    expect(screen.getByText(/Annotated DOCX and PDF exports need a completed audit/i)).toBeInTheDocument();
    expect(screen.getByText(/No audit evidence yet/i)).toBeInTheDocument();
  });

  it("blocks stale evidence exports while retaining plain manuscript export", () => {
    render(
      <DocumentExportSuite
        data={EMPTY_RESULT}
        audit={{ ...COMPLETED, freshness: "stale", phase: "stale" }}
        manuscriptText="Edited manuscript text."
        documentName="paper.docx"
      />,
    );

    expect(screen.getByTestId("export-clean-docx-btn")).toBeEnabled();
    expect(screen.getByTestId("export-redline-docx-btn")).toBeDisabled();
    expect(screen.getByTestId("export-pdf-report-btn")).toBeDisabled();
    expect(screen.getByText(/edited after this audit/i)).toBeInTheDocument();
  });
});
