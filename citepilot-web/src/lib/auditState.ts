/**
 * Explicit document/audit state model.
 *
 * The dashboard must never present an unrun, failed, stale, or partial audit as
 * a clean result. This reducer makes those states explicit and testable
 * independently of the React components that render them.
 */
import type { AuditMode, AuditResponse, AnalysisCheck, CitationStyle } from "@/lib/types";

export type AuditErrorCode =
  | "ai_not_configured"
  | "analysis_budget_exhausted"
  | "provider_timeout"
  | "provider_rate_limited"
  | "provider_invalid_response"
  | "provider_unavailable"
  | "network_error"
  | "client_timeout"
  | "invalid_mode"
  | "invalid_citation_style"
  | "invalid_request"
  | "empty_file"
  | "file_too_large"
  | "text_too_large"
  | "unparseable_file"
  | "unsupported_file"
  | "corrupt_file"
  | "empty_text"
  | "missing_document"
  | "analysis_failed"
  | "unknown";

export interface AuditError {
  message: string;
  code: AuditErrorCode;
  retryable: boolean;
  requestId: string | null;
  /** Epoch ms, used to decide whether the failure is newer than the last result. */
  at: number;
}

export interface AuditResultRecord {
  data: AuditResponse;
  checks: AnalysisCheck[];
  /** `partial` when at least one check could not complete. */
  status: "completed" | "partial";
  /** Document revision the result belongs to. */
  revision: number;
  style: CitationStyle;
  mode: AuditMode;
  completedAt: number;
  requestId: string | null;
}

export interface AuditRun {
  revision: number;
  style: CitationStyle;
  mode: AuditMode;
  requestId: string;
  startedAt: number;
}

export interface AuditState {
  hasDocument: boolean;
  /** Increments whenever the manuscript text or selected file changes. */
  revision: number;
  style: CitationStyle;
  mode: AuditMode;
  run: AuditRun | null;
  lastResult: AuditResultRecord | null;
  lastError: AuditError | null;
  /** Increments on every successful audit, for effect/announcement keys. */
  successCount: number;
}

export type AuditEvent =
  | { type: "document/changed" }
  | { type: "document/replaced"; hasDocument: boolean }
  | { type: "document/emptied" }
  | { type: "settings/changed"; style: CitationStyle; mode: AuditMode }
  | { type: "audit/started"; style: CitationStyle; mode: AuditMode; requestId: string; at: number }
  | {
      type: "audit/succeeded";
      requestId: string;
      data: AuditResponse;
      checks: AnalysisCheck[];
      status: "completed" | "partial";
      at: number;
    }
  | { type: "audit/failed"; requestId: string; error: AuditError }
  | { type: "audit/cancelled"; requestId: string }
  | {
      /** Adopt a stored audit loaded from history for the current revision. */
      type: "audit/loaded";
      data: AuditResponse;
      checks: AnalysisCheck[];
      status: "completed" | "partial";
      style: CitationStyle;
      mode: AuditMode;
      at: number;
    };

export function createAuditState(
  overrides: Partial<Pick<AuditState, "hasDocument" | "style" | "mode">> = {}
): AuditState {
  return {
    hasDocument: overrides.hasDocument ?? false,
    revision: 0,
    style: overrides.style ?? "apa7",
    mode: overrides.mode ?? "full",
    run: null,
    lastResult: null,
    lastError: null,
    successCount: 0,
  };
}

function runMatches(
  run: AuditRun | null,
  requestId: string,
  state: AuditState
): boolean {
  return Boolean(
    run &&
      run.requestId === requestId &&
      run.revision === state.revision &&
      run.style === state.style &&
      run.mode === state.mode
  );
}

export function auditReducer(state: AuditState, event: AuditEvent): AuditState {
  switch (event.type) {
    case "document/changed":
      return {
        ...state,
        hasDocument: true,
        revision: state.revision + 1,
        // An in-flight request for the previous revision must not attach its
        // result to the new document.
        run: null,
      };
    case "document/replaced":
      return {
        ...state,
        hasDocument: event.hasDocument,
        revision: state.revision + 1,
        run: null,
        lastResult: null,
        lastError: null,
      };
    case "document/emptied":
      return {
        ...createAuditState({ style: state.style, mode: state.mode }),
        revision: state.revision + 1,
      };
    case "settings/changed":
      if (state.style === event.style && state.mode === event.mode) return state;
      return {
        ...state,
        style: event.style,
        mode: event.mode,
        run: null,
      };
    case "audit/started":
      return {
        ...state,
        run: {
          revision: state.revision,
          style: event.style,
          mode: event.mode,
          requestId: event.requestId,
          startedAt: event.at,
        },
        lastError: null,
      };
    case "audit/succeeded": {
      // Reject responses that belong to a superseded request, document
      // revision, or audit settings.
      if (!runMatches(state.run, event.requestId, state)) return state;
      return {
        ...state,
        run: null,
        lastError: null,
        successCount: state.successCount + 1,
        lastResult: {
          data: event.data,
          checks: event.checks,
          status: event.status,
          revision: state.revision,
          style: state.style,
          mode: state.mode,
          completedAt: event.at,
          requestId: event.requestId,
        },
      };
    }
    case "audit/failed":
      if (state.run?.requestId !== event.requestId) return state;
      return { ...state, run: null, lastError: event.error };
    case "audit/cancelled":
      if (state.run?.requestId !== event.requestId) return state;
      return { ...state, run: null };
    case "audit/loaded":
      return {
        ...state,
        hasDocument: true,
        style: event.style,
        mode: event.mode,
        run: null,
        lastError: null,
        lastResult: {
          data: event.data,
          checks: event.checks,
          status: event.status,
          revision: state.revision,
          style: event.style,
          mode: event.mode,
          completedAt: event.at,
          requestId: event.data.request_id ?? null,
        },
      };
    default:
      return state;
  }
}

export interface AuditSummary {
  phase: "empty" | "ready" | "running" | "completed" | "stale" | "failed";
  /** Whether the last result still matches the current document/settings. */
  freshness: "none" | "current" | "stale";
  headline: string;
  description: string;
  tone: "neutral" | "info" | "success" | "warning" | "error";
  /** A result exists and can be shown (possibly marked stale). */
  showsResult: boolean;
  /** True only for a current, fully completed audit with no open findings. */
  isClean: boolean;
  /** Checks that could not run, or could not cover every item, in the latest result. */
  incompleteChecks: AnalysisCheck[];
}

export function incompleteChecks(checks: AnalysisCheck[] | undefined): AnalysisCheck[] {
  return (checks || []).filter(
    (c) =>
      c.status === "unavailable" ||
      c.status === "partial" ||
      (c.status === "skipped" && c.reason === "budget")
  );
}

export function auditSummary(state: AuditState): AuditSummary {
  const result = state.lastResult;
  const stale = Boolean(
    result &&
      (result.revision !== state.revision ||
        result.style !== state.style ||
        result.mode !== state.mode)
  );
  const failedAfterResult =
    Boolean(state.lastError) &&
    (!result || (state.lastError?.at ?? 0) >= (result?.completedAt ?? 0));

  if (state.run) {
    return {
      phase: "running",
      freshness: result ? (stale ? "stale" : "current") : "none",
      headline: "Audit in progress",
      description:
        "The audit is running. Your manuscript stays in the editor while the request completes.",
      tone: "info",
      showsResult: Boolean(result),
      isClean: false,
      incompleteChecks: [],
    };
  }

  if (failedAfterResult) {
    return {
      phase: "failed",
      freshness: result ? (stale ? "stale" : "current") : "none",
      headline: result ? "Latest audit failed" : "Audit failed",
      description: result
        ? "The last successful result is still shown below, but it is not from this attempt."
        : "No results were produced. Your manuscript is preserved — fix the problem and retry.",
      tone: "error",
      showsResult: Boolean(result),
      isClean: false,
      incompleteChecks: incompleteChecks(result?.checks),
    };
  }

  if (result) {
    const incomplete = incompleteChecks(result.checks);
    if (stale) {
      return {
        phase: "stale",
        freshness: "stale",
        headline: "Edited since this audit",
        description:
          "The document, citation style, or audit mode changed after this result was produced. Re-run the audit to refresh it.",
        tone: "warning",
        showsResult: true,
        isClean: false,
        incompleteChecks: incomplete,
      };
    }
    if (result.status === "partial" || incomplete.length > 0) {
      return {
        phase: "completed",
        freshness: "current",
        headline: "Audit completed with incomplete checks",
        description:
          "Some checks could not cover every item, or could not run. Missing findings for those checks do not mean the document is clean.",
        tone: "warning",
        showsResult: true,
        isClean: false,
        incompleteChecks: incomplete,
      };
    }
    return {
      phase: "completed",
      freshness: "current",
      headline: "Audit completed",
      description: "Every requested check completed for this revision.",
      tone: "success",
      showsResult: true,
      isClean: true,
      incompleteChecks: [],
    };
  }

  if (state.hasDocument) {
    return {
      phase: "ready",
      freshness: "none",
      headline: "Ready to audit",
      description:
        "This document has not been audited yet. Run the audit to see findings.",
      tone: "neutral",
      showsResult: false,
      isClean: false,
      incompleteChecks: [],
    };
  }

  return {
    phase: "empty",
    freshness: "none",
    headline: "No document",
    description: "Upload a file or paste manuscript text to start.",
    tone: "neutral",
    showsResult: false,
    isClean: false,
    incompleteChecks: [],
  };
}

/** Count of findings in an audit response, across every reported category. */
export function countFindings(data: AuditResponse | null | undefined): number {
  if (!data) return 0;
  return (
    (data.citations?.filter((c) => c.status === "no_match").length || 0) +
    (data.references?.filter((r) => r.status === "orphaned" || r.status === "retracted")
      .length || 0) +
    (data.style_warnings?.length || 0) +
    (data.uncited_claims?.length || 0)
  );
}
