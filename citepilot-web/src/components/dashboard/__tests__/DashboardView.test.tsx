// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DashboardView from "../DashboardView";
import type { AuditResponse } from "@/lib/types";

const runAuditMock = vi.fn();

vi.mock("@/lib/api", () => ({
  runAudit: (...args: unknown[]) => runAuditMock(...args),
  exportDocx: vi.fn().mockResolvedValue(new Blob(["docx"])),
  exportPdf: vi.fn().mockResolvedValue(new Blob(["pdf"])),
}));

vi.mock("@/lib/utils", () => ({ downloadBlob: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  isPro: true,
}));

vi.mock("@/lib/auth/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: null,
    isPro: authState.isPro,
    loading: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    signInWithPassword: vi.fn(),
    signUpWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
  }),
}));

vi.mock("@/lib/editor/docxExtractor", () => ({
  extractDocxSemantic: vi.fn(),
}));

const COMPLETED_RESPONSE: AuditResponse = {
  request_id: "req-test",
  status: "completed",
  checks: [
    { name: "citations", label: "In-text citation extraction", status: "completed" },
    { name: "references", label: "Reference list parsing", status: "completed" },
  ],
  citations: [],
  references: [],
  style_warnings: [],
  uncited_claims: [],
};

function typeIntoTextarea(value: string) {
  const textarea = screen.getByRole("textbox", {
    name: /paste manuscript text or a reference list/i,
  });
  fireEvent.change(textarea, { target: { value } });
  return textarea;
}

describe("dashboard workflow", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    authState.user = null;
    authState.isPro = true;
  });
  afterEach(() => cleanup());

  it("keeps the textarea mounted while typing character by character", () => {
    render(<DashboardView />);
    const original = screen.getByRole("textbox");
    let value = "";
    for (const ch of "abc") {
      value += ch;
      fireEvent.change(original, { target: { value } });
      expect(screen.getByRole("textbox")).toBe(original);
    }
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("abc");
  });

  it("says 'Ready to audit' before the first run", () => {
    render(<DashboardView />);
    typeIntoTextarea("A manuscript about citations.");
    expect(screen.getByTestId("audit-state-headline")).toHaveTextContent("Ready to audit");
    expect(screen.queryByText("Nothing flagged")).not.toBeInTheDocument();
  });

  it("prevents duplicate requests from the button and the keyboard shortcut", async () => {
    let resolveAudit: (value: AuditResponse) => void = () => {};
    runAuditMock.mockImplementation(
      () =>
        new Promise<AuditResponse>((resolve) => {
          resolveAudit = resolve;
        })
    );

    render(<DashboardView />);
    typeIntoTextarea("A manuscript about citations.");

    const runButton = screen.getByTestId("run-audit-btn");
    fireEvent.click(runButton);
    await waitFor(() => expect(runAuditMock).toHaveBeenCalledTimes(1));

    // Keyboard shortcut and repeated clicks while the request is in flight.
    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
    fireEvent.click(runButton);
    fireEvent.click(runButton);
    expect(runAuditMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAudit(COMPLETED_RESPONSE);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("audit-state-headline")).toHaveTextContent("Audit completed")
    );
  });

  it("labels results stale after an edit and keeps the draft across panel switches", async () => {
    runAuditMock.mockResolvedValue(COMPLETED_RESPONSE);

    render(<DashboardView />);
    typeIntoTextarea("Original manuscript text with (Smith, 2020).");
    fireEvent.click(screen.getByTestId("run-audit-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("audit-state-headline")).toHaveTextContent("Audit completed")
    );

    // Editing after the audit must not keep presenting it as current.
    fireEvent.click(screen.getByRole("button", { name: /add or replace document/i }));
    typeIntoTextarea("Original manuscript text with (Smith, 2020). Plus a new sentence.");

    await waitFor(() =>
      expect(screen.getByTestId("audit-state-headline")).toHaveTextContent(
        "Edited since this audit"
      )
    );
    expect(screen.getByText(/re-run it to refresh findings/i)).toBeInTheDocument();

    // Switching to Export and back preserves the editor and its text.
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("heading", { name: "Export" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editor" }));

    expect(screen.getByTestId("document-editor-canvas")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("document-editor-canvas")).getByText(
        /Original manuscript text with \(Smith, 2020\)\. Plus a new sentence\./
      )
    ).toBeInTheDocument();
  });

  it("does not attach a late response to a replaced document", async () => {
    let resolveAudit: (value: AuditResponse) => void = () => {};
    runAuditMock.mockImplementation(
      () =>
        new Promise<AuditResponse>((resolve) => {
          resolveAudit = resolve;
        })
    );

    render(<DashboardView />);
    typeIntoTextarea("First document text.");
    fireEvent.click(screen.getByTestId("run-audit-btn"));
    await waitFor(() => expect(runAuditMock).toHaveBeenCalledTimes(1));

    // Clear the document (with confirmation) while the request is in flight.
    fireEvent.click(
      screen.getByRole("button", { name: /^clear document pasted manuscript$/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /clear and start over/i }));

    typeIntoTextarea("Replacement document text.");

    await act(async () => {
      resolveAudit(COMPLETED_RESPONSE);
      await Promise.resolve();
      await Promise.resolve();
    });

    // The stale response must not be attached to the replacement document.
    expect(screen.getByTestId("audit-state-headline")).toHaveTextContent("Ready to audit");
    expect(screen.queryByText("Nothing flagged")).not.toBeInTheDocument();
  });

  it("loads a saved audit with its manuscript, style, and mode intact", async () => {
    authState.user = { id: "user-1" };
    const savedAudit = {
      id: "audit-1",
      document_name: "Saved Paper",
      citation_style: "vancouver",
      audit_mode: "reference_only",
      word_count: 42,
      citation_count: 1,
      reference_count: 1,
      score: 50,
      created_at: new Date("2026-11-01T10:00:00Z").toISOString(),
      results: {
        ...COMPLETED_RESPONSE,
        manuscript_text: "Saved manuscript text (Lee, 2022).",
        citations: [{ raw_text: "(Lee, 2022)", status: "no_match" as const }],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ audits: [savedAudit] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardView />);
    fireEvent.click(screen.getByRole("button", { name: "History" }));

    const loadButton = await screen.findByRole("button", {
      name: /load audit report for saved paper/i,
    });
    fireEvent.click(loadButton);

    await waitFor(() =>
      expect(screen.getByTestId("audit-state-headline")).toHaveTextContent("Audit completed")
    );

    // The saved manuscript, style, and mode are restored, not merged with the
    // empty document that was open before.
    const textarea = screen.queryByRole("textbox");
    expect(textarea).toBeNull(); // input replaced by the review canvas
    expect(
      screen.getByTestId("document-editor-canvas").textContent
    ).toContain("Saved manuscript text (Lee, 2022).");
    const styleSelects = screen.getAllByRole("combobox", { name: /citation style/i });
    expect(styleSelects[0]).toHaveValue("vancouver");
    expect(
      screen
        .getAllByRole("button", { name: "References only" })
        .some((b) => b.getAttribute("aria-pressed") === "true")
    ).toBe(true);

    vi.unstubAllGlobals();
  });
});
