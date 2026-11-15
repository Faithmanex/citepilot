// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudit } from "../useAudit";
import type { AuditResponse } from "../types";

vi.mock("../api", () => ({
  ApiError: class ApiError extends Error {},
  runAudit: vi.fn(),
}));

import { runAudit } from "../api";

const mockedRunAudit = vi.mocked(runAudit);

function renderAudit(overrides: Record<string, unknown> = {}) {
  return renderHook(() =>
    useAudit({
      text: "",
      file: null,
      style: "apa7",
      mode: "full",
      documentName: "No document loaded",
      isPro: false,
      user: null,
      showToast: vi.fn(),
      onSuccess: vi.fn(),
      onUpgradeRequired: vi.fn(),
      ...overrides,
    })
  );
}

describe("useAudit", () => {
  it("discards all success side effects after document replacement", async () => {
    let resolve!: (data: AuditResponse) => void;
    mockedRunAudit.mockImplementation(() => new Promise(r => { resolve = r; }));
    const onSuccess = vi.fn();
    const showToast = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderAudit({ text: "Original", onSuccess, showToast, user: { id: "u" } });
    let pending!: Promise<void>;
    act(() => { pending = result.current.runAudit(); });
    act(() => result.current.replaceDocument(true));
    await act(async () => {
      resolve({ citations: [], references: [], manuscript_text: "Old response" });
      await pending;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves the full manuscript when reference-only analysis echoes a section", async () => {
    mockedRunAudit.mockResolvedValue({ citations: [], references: [], manuscript_text: "References only" });
    const onSuccess = vi.fn();
    const { result } = renderAudit({ text: "Full body\nReferences only", mode: "reference_only", onSuccess });
    await act(async () => { await result.current.runAudit(); });
    expect(onSuccess.mock.calls[0][0].manuscript_text).toBe("Full body\nReferences only");
  });

  it.each(["rtf", "bib"])("submits an unparsed %s file for server parsing", async (extension) => {
    mockedRunAudit.mockResolvedValue({ citations: [], references: [], manuscript_text: "Normalized text" });
    const file = new File(["encoded file"], `paper.${extension}`);
    const { result } = renderAudit({ file });
    await act(async () => { await result.current.runAudit(); });
    const body = mockedRunAudit.mock.calls[0][0];
    expect(body.get("file")).toBe(file);
    expect(body.has("text")).toBe(false);
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a toast and does not run when no document is provided", async () => {
    const showToast = vi.fn();
    const onSuccess = vi.fn();
    const onUpgradeRequired = vi.fn();
    const { result } = renderAudit({ showToast, onSuccess, onUpgradeRequired });

    await act(async () => {
      await result.current.runAudit();
    });

    expect(showToast).toHaveBeenCalledWith(
      "Please upload a document file or paste manuscript text."
    );
    expect(onUpgradeRequired).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockedRunAudit).not.toHaveBeenCalled();
    expect(result.current.progress.visible).toBe(false);
  });

  it("blocks free-tier audits over the word limit and prompts upgrade", async () => {
    const showToast = vi.fn();
    const onUpgradeRequired = vi.fn();
    const longText = new Array(1501).fill("word").join(" ");
    const { result } = renderAudit({ text: longText, showToast, onUpgradeRequired });

    await act(async () => {
      await result.current.runAudit();
    });

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("Free Plan allows up to"));
    expect(onUpgradeRequired).toHaveBeenCalledTimes(1);
    expect(mockedRunAudit).not.toHaveBeenCalled();
    expect(result.current.progress.visible).toBe(false);
  });

  it("runs the audit, reports success, and auto-saves for signed-in users", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const data: AuditResponse = {
      citations: [{ raw_text: "(Smith, 2020)", status: "matched" }],
      references: [{ raw_entry: "Smith (2020)", status: "cited" }],
      style_warnings: [],
      uncited_claims: [],
    };
    mockedRunAudit.mockResolvedValue(data);

    const showToast = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderAudit({
      text: "Body text with (Smith, 2020).",
      isPro: true,
      user: { id: "u1" },
      documentName: "My Paper",
      showToast,
      onSuccess,
    });

    await act(async () => {
      await result.current.runAudit();
    });

    expect(mockedRunAudit).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining(data));
    expect(showToast).toHaveBeenCalledWith("Manuscript audit completed successfully!");
    expect(result.current.progress.visible).toBe(false);
    expect(result.current.errorModal.visible).toBe(false);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/audits/save",
      expect.objectContaining({ method: "POST" })
    );
    const saveBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(saveBody.document_name).toBe("My Paper");
    expect(saveBody.citation_style).toBe("apa7");
    expect(saveBody.audit_mode).toBe("full");
    expect(saveBody.score).toBe(100);
  });

  it("shows the error modal when the audit request fails", async () => {
    mockedRunAudit.mockRejectedValue(new Error("boom"));
    const showToast = vi.fn();
    const { result } = renderAudit({
      text: "Body text.",
      showToast,
    });

    await act(async () => {
      await result.current.runAudit();
    });

    expect(result.current.errorModal.visible).toBe(true);
    expect(result.current.errorModal.title).toBe("Audit Execution Error");
    expect(result.current.errorModal.message).toBe("boom");
    expect(result.current.errorModal.retryable).toBe(true);
    expect(showToast).toHaveBeenCalledWith(
      "Audit failed. Your manuscript is preserved; you can retry."
    );
    expect(result.current.progress.visible).toBe(false);
    expect(result.current.summary.phase).toBe("failed");
  });

  it("never reports a clean audit before one has run", async () => {
    const { result } = renderAudit({ text: "Body text." });

    expect(result.current.summary.phase).toBe("ready");
    expect(result.current.summary.isClean).toBe(false);
    expect(result.current.summary.showsResult).toBe(false);
  });

  it("rejects duplicate submissions while a request is in flight", async () => {
    let resolveAudit: (value: AuditResponse) => void = () => {};
    mockedRunAudit.mockImplementation(
      () => new Promise<AuditResponse>((resolve) => {
        resolveAudit = resolve;
      })
    );
    const onSuccess = vi.fn();
    const { result } = renderAudit({ text: "Body text.", onSuccess, isPro: true });

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.runAudit();
      // Second and third triggers arrive before the first response.
      void result.current.runAudit();
      void result.current.runAudit();
      await Promise.resolve();
    });
    expect(mockedRunAudit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAudit({ citations: [], references: [], style_warnings: [], uncited_claims: [] });
      await first;
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("keeps a failed audit from being reported as a clean result", async () => {
    mockedRunAudit.mockRejectedValue(new Error("provider down"));
    const { result } = renderAudit({ text: "Body text.", isPro: true });

    await act(async () => {
      await result.current.runAudit();
    });

    expect(result.current.summary.phase).toBe("failed");
    expect(result.current.summary.isClean).toBe(false);
    expect(result.current.summary.showsResult).toBe(false);
  });
});
