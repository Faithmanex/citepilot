import { describe, it, expect } from "vitest";
import {
  auditReducer,
  auditSummary,
  countFindings,
  createAuditState,
  type AuditEvent,
  type AuditState,
} from "../auditState";
import type { AnalysisCheck, AuditResponse } from "../types";

const COMPLETED_CHECKS: AnalysisCheck[] = [
  { name: "citations", label: "In-text citation extraction", status: "completed" },
  { name: "references", label: "Reference list parsing", status: "completed" },
  { name: "verification", label: "Crossref / OpenAlex verification", status: "completed" },
];

const EMPTY_RESULT: AuditResponse = {
  citations: [],
  references: [],
  style_warnings: [],
  uncited_claims: [],
};

function apply(state: AuditState, ...events: AuditEvent[]): AuditState {
  return events.reduce(auditReducer, state);
}

function completedState(data: AuditResponse = EMPTY_RESULT): AuditState {
  const base = createAuditState({ hasDocument: true });
  return apply(
    base,
    {
      type: "audit/started",
      style: "apa7",
      mode: "full",
      requestId: "req-1",
      at: 1000,
    },
    {
      type: "audit/succeeded",
      requestId: "req-1",
      data,
      checks: COMPLETED_CHECKS,
      status: "completed",
      at: 2000,
    }
  );
}

describe("audit state model", () => {
  it("reports an audited document as ready, never as clean", () => {
    const state = createAuditState({ hasDocument: true });
    const summary = auditSummary(state);

    expect(summary.phase).toBe("ready");
    expect(summary.headline).toBe("Ready to audit");
    expect(summary.isClean).toBe(false);
    expect(summary.showsResult).toBe(false);
  });

  it("reports empty when no document is loaded", () => {
    expect(auditSummary(createAuditState()).phase).toBe("empty");
  });

  it("treats a completed audit with zero findings as clean only then", () => {
    const state = completedState();
    const summary = auditSummary(state);

    expect(summary.phase).toBe("completed");
    expect(summary.freshness).toBe("current");
    expect(summary.isClean).toBe(true);
    expect(countFindings(state.lastResult?.data)).toBe(0);
  });

  it("marks a completed audit with unavailable checks as partial, not clean", () => {
    const checks: AnalysisCheck[] = [
      ...COMPLETED_CHECKS.slice(0, 2),
      {
        name: "verification",
        label: "Crossref / OpenAlex verification",
        status: "unavailable",
        message: "Verification timed out.",
      },
    ];
    const state = apply(
      createAuditState({ hasDocument: true }),
      { type: "audit/started", style: "apa7", mode: "full", requestId: "r", at: 1 },
      {
        type: "audit/succeeded",
        requestId: "r",
        data: EMPTY_RESULT,
        checks,
        status: "partial",
        at: 2,
      }
    );
    const summary = auditSummary(state);

    expect(summary.phase).toBe("completed");
    expect(summary.isClean).toBe(false);
    expect(summary.tone).toBe("warning");
    expect(summary.incompleteChecks).toHaveLength(1);
  });

  it("marks results stale when the text, style, or mode changes", () => {
    const afterText = apply(completedState(), { type: "document/changed" });
    expect(auditSummary(afterText).phase).toBe("stale");
    expect(auditSummary(afterText).freshness).toBe("stale");
    expect(auditSummary(afterText).isClean).toBe(false);

    const afterStyle = apply(completedState(), {
      type: "settings/changed",
      style: "vancouver",
      mode: "full",
    });
    expect(auditSummary(afterStyle).phase).toBe("stale");

    const afterMode = apply(completedState(), {
      type: "settings/changed",
      style: "apa7",
      mode: "reference_only",
    });
    expect(auditSummary(afterMode).phase).toBe("stale");
  });

  it("discards a response that arrives after the document changed", () => {
    const started = apply(createAuditState({ hasDocument: true }), {
      type: "audit/started",
      style: "apa7",
      mode: "full",
      requestId: "old",
      at: 1,
    });
    const replaced = apply(started, { type: "document/changed" });
    const late = apply(replaced, {
      type: "audit/succeeded",
      requestId: "old",
      data: EMPTY_RESULT,
      checks: COMPLETED_CHECKS,
      status: "completed",
      at: 2,
    });

    expect(late.lastResult).toBeNull();
    expect(auditSummary(late).phase).toBe("ready");
  });

  it("keeps the last successful result identifiable after a failure", () => {
    const failed = apply(
      completedState(),
      { type: "audit/started", style: "apa7", mode: "full", requestId: "req-2", at: 3000 },
      {
        type: "audit/failed",
        requestId: "req-2",
        error: {
          message: "Provider timed out.",
          code: "provider_timeout",
          retryable: true,
          requestId: "req-2",
          at: 4000,
        },
      }
    );
    const summary = auditSummary(failed);

    expect(summary.phase).toBe("failed");
    expect(summary.showsResult).toBe(true);
    expect(summary.isClean).toBe(false);
    expect(failed.lastResult?.completedAt).toBe(2000);
    expect(failed.lastError?.code).toBe("provider_timeout");
  });

  it("clears all analysis state when the document is replaced or emptied", () => {
    const replaced = apply(completedState({ citations: [{ raw_text: "(A, 2020)", status: "no_match" }] }), {
      type: "document/replaced",
      hasDocument: true,
    });

    expect(replaced.lastResult).toBeNull();
    expect(replaced.lastError).toBeNull();
    expect(auditSummary(replaced).phase).toBe("ready");

    const emptied = apply(completedState(), { type: "document/emptied" });
    expect(auditSummary(emptied).phase).toBe("empty");
  });

  it("counts only real findings", () => {
    expect(
      countFindings({
        citations: [
          { raw_text: "(A, 2020)", status: "matched" },
          { raw_text: "(B, 2021)", status: "no_match" },
        ],
        references: [
          { raw_entry: "A", status: "cited" },
          { raw_entry: "B", status: "orphaned" },
          { raw_entry: "C", status: "retracted" },
        ],
        style_warnings: [{ code: "X" }],
        uncited_claims: [{ claim_text: "x" }, { claim_text: "y" }],
      })
    ).toBe(6);
  });
});
