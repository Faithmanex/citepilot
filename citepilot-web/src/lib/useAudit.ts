"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { AuditMode, AuditResponse, AnalysisCheck, CitationStyle } from "@/lib/types";
import { ApiError, runAudit } from "@/lib/api";
import { checkAuditEntitlement } from "@/lib/gating";
import { computeMatchRate } from "@/lib/auditStats";
import {
  auditReducer,
  auditSummary,
  createAuditState,
  type AuditError,
} from "@/lib/auditState";

/**
 * Client-side ceiling for a single analysis request. The server budget is
 * 45s by default and Vercel terminates at 60s; waiting longer than this only
 * leaves the user staring at a spinner.
 */
export const CLIENT_ANALYSIS_TIMEOUT_MS = 75_000;

export interface ErrorModalState {
  visible: boolean;
  title: string;
  message: string;
  retryable: boolean;
  requestId: string | null;
}

export interface AuditProgress {
  visible: boolean;
  message: string;
  startedAt: number;
  /** Honest indeterminate stage list. No fabricated percentages. */
  stages: Array<{ label: string; state: "done" | "active" | "pending" }>;
}

interface UseAuditParams {
  text: string;
  file: File | null;
  style: CitationStyle;
  mode: AuditMode;
  documentName: string;
  isPro: boolean;
  user: { id: string } | null;
  showToast: (message: string) => void;
  onSuccess: (data: AuditResponse) => void;
  onUpgradeRequired: () => void;
}

function newClientRequestId(): string {
  return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toAuditError(err: unknown): AuditError {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      code: err.code,
      retryable: err.retryable,
      requestId: err.requestId,
      at: Date.now(),
    };
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return {
      message:
        "The audit took longer than the client is willing to wait and was cancelled. The server may still be finishing, but no result was attached. Your manuscript is preserved — retry, or try a shorter document.",
      code: "client_timeout",
      retryable: true,
      requestId: null,
      at: Date.now(),
    };
  }
  return {
    message:
      (err as Error)?.message ||
      "The audit failed unexpectedly. Your manuscript is preserved — retrying is appropriate.",
    code: "unknown",
    retryable: true,
    requestId: null,
    at: Date.now(),
  };
}

export function useAudit({
  text,
  file,
  style,
  mode,
  documentName,
  isPro,
  user,
  showToast,
  onSuccess,
  onUpgradeRequired,
}: UseAuditParams) {
  const [state, dispatch] = useReducer(
    auditReducer,
    undefined,
    () => createAuditState({ hasDocument: Boolean(text.trim() || file), style, mode })
  );
  const [errorDismissed, setErrorDismissed] = useState(false);

  const runningRef = useRef(false);
  const lastInputRef = useRef<{ text: string; file: File | null }>({ text, file });

  // Track document revisions (text edits and file replacement). The effect runs
  // after every committed input change, so an in-flight result from a previous
  // revision is discarded by the reducer.
  useEffect(() => {
    const previous = lastInputRef.current;
    if (previous.text === text && previous.file === file) return;
    lastInputRef.current = { text, file };
    if (!text.trim() && !file) {
      dispatch({ type: "document/emptied" });
    } else {
      dispatch({ type: "document/changed" });
    }
  }, [text, file]);

  useEffect(() => {
    dispatch({ type: "settings/changed", style, mode });
  }, [style, mode]);

  const summary = useMemo(() => auditSummary(state), [state]);

  const progress: AuditProgress = state.run
    ? {
        visible: true,
        message: "Running citation and reference audit…",
        startedAt: state.run.startedAt,
        stages: [
          { label: "Document sent to the analysis service", state: "done" },
          { label: "Extracting citations and reference entries", state: "active" },
          { label: "Verifying references with Crossref and OpenAlex", state: "pending" },
          { label: "Preparing findings", state: "pending" },
        ],
      }
    : { visible: false, message: "", startedAt: 0, stages: [] };

  const runAuditFn = useCallback(async () => {
    // Duplicate submissions (button + keyboard shortcut + debounced re-audit)
    // must not fan out into parallel provider requests.
    if (runningRef.current) return;

    const textVal = text.trim();
    if (!textVal && !file) {
      showToast("Please upload a document file or paste manuscript text.");
      return;
    }

    const entitlement = checkAuditEntitlement(textVal, isPro);
    if (!entitlement.allowed) {
      showToast(entitlement.reason || "Audit limit exceeded for Free plan.");
      onUpgradeRequired();
      return;
    }

    const requestId = newClientRequestId();
    const formData = new FormData();
    if (textVal) {
      formData.append("text", textVal);
    } else if (file) {
      formData.append("file", file);
    }
    formData.append("citation_style", style);
    formData.append("mode", mode);

    runningRef.current = true;
    setErrorDismissed(false);
    dispatch({
      type: "audit/started",
      style,
      mode,
      requestId,
      at: Date.now(),
    });

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_ANALYSIS_TIMEOUT_MS);

    try {
      const data = await runAudit(formData, {
        signal: controller.signal,
        requestId,
      });
      const checks = data.checks || [];
      // The server is authoritative about partial results; a check that was
      // skipped because the audit mode does not need it is not an incomplete
      // audit.
      const status = data.status === "partial" ? "partial" : "completed";

      dispatch({
        type: "audit/succeeded",
        requestId,
        data,
        checks,
        status,
        at: Date.now(),
      });
      onSuccess(data);

      if (status === "partial") {
        showToast(
          "Audit finished, but some checks could not complete. Review the unavailable checks."
        );
      } else {
        showToast("Manuscript audit completed successfully!");
      }

      // Auto-save audit for authenticated users in the background
      if (user) {
        await saveAuditToHistory({
          documentName,
          style,
          mode,
          wordCount: entitlement.wordCount,
          citationCount: data.citations?.length || 0,
          referenceCount: data.references?.length || 0,
          score: computeMatchRate(data),
          results: data,
          manuscriptText: textVal,
        });
      }
    } catch (err) {
      const error = timedOut
        ? toAuditError(new DOMException("Timed out", "AbortError"))
        : toAuditError(err);
      dispatch({ type: "audit/failed", requestId, error });
      showToast(
        error.retryable
          ? "Audit failed. Your manuscript is preserved; you can retry."
          : "Audit failed and retrying will not help until the problem is fixed."
      );
    } finally {
      clearTimeout(timeout);
      runningRef.current = false;
    }
  }, [
    text,
    file,
    style,
    mode,
    documentName,
    isPro,
    user,
    showToast,
    onSuccess,
    onUpgradeRequired,
  ]);

  const closeErrorModal = useCallback(() => setErrorDismissed(true), []);

  const replaceDocument = useCallback(
    (
      hasDocument: boolean,
      nextInput?: { text: string; file: File | null }
    ) => {
      // Keep the input snapshot in sync so the post-render change effect does
      // not count the replacement as another revision.
      if (nextInput) lastInputRef.current = nextInput;
      dispatch({ type: "document/replaced", hasDocument });
    },
    []
  );

  /** Adopts a stored audit (history) as the current result. */
  const loadResult = useCallback(
    (input: {
      data: AuditResponse;
      checks: AnalysisCheck[];
      status: "completed" | "partial";
      style: CitationStyle;
      mode: AuditMode;
    }) => {
      dispatch({ type: "audit/loaded", ...input, at: Date.now() });
    },
    []
  );

  const errorModal: ErrorModalState = {
    visible: Boolean(state.lastError) && !errorDismissed,
    title:
      state.lastError && !state.lastError.retryable
        ? "Audit could not run"
        : "Audit Execution Error",
    message: state.lastError?.message || "",
    retryable: state.lastError?.retryable ?? true,
    requestId: state.lastError?.requestId ?? null,
  };

  return {
    state,
    summary,
    progress,
    errorModal,
    error: state.lastError,
    isRunning: Boolean(state.run),
    runAudit: runAuditFn,
    retry: runAuditFn,
    closeErrorModal,
    replaceDocument,
    loadResult,
  };
}

interface SaveAuditPayload {
  documentName: string;
  style: CitationStyle;
  mode: AuditMode;
  wordCount: number;
  citationCount: number;
  referenceCount: number;
  score: number;
  results: AuditResponse;
  manuscriptText: string;
}

async function saveAuditToHistory({
  documentName,
  style,
  mode,
  wordCount,
  citationCount,
  referenceCount,
  score,
  results,
  manuscriptText,
}: SaveAuditPayload) {
  try {
    await fetch("/api/audits/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_name: documentName,
        citation_style: style,
        audit_mode: mode,
        word_count: wordCount,
        citation_count: citationCount,
        reference_count: referenceCount,
        score,
        // Store the audited manuscript with the result so history can restore
        // the exact revision the findings belong to.
        results: { ...results, manuscript_text: manuscriptText },
      }),
    });
  } catch (saveErr) {
    console.warn("Could not auto-save audit history:", saveErr);
  }
}
