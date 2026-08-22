// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudit } from "../useAudit";
import type { AuditResponse } from "../types";

vi.mock("../api", () => ({
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
    expect(onSuccess).toHaveBeenCalledWith(data);
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
    expect(showToast).toHaveBeenCalledWith("Audit Error: boom");
    expect(result.current.progress.visible).toBe(false);
  });
});
