/**
 * Sanitized structured logging for the analysis pipeline.
 *
 * Only stage names, timings, statuses, provider error categories, and the
 * request id are logged. Manuscript text, reference text, prompts, model
 * output, and credentials must never reach these logs.
 */
import type { CheckStatus } from "./types";

export interface StageLog {
  requestId: string;
  stage: string;
  status: CheckStatus["status"];
  durationMs: number;
  /** Sanitized error category/detail; never document content. */
  errorKind?: string;
  errorDetail?: string;
}

export function newRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function logStage(entry: StageLog): void {
  const payload = {
    event: "analysis_stage",
    request_id: entry.requestId,
    stage: entry.stage,
    status: entry.status,
    duration_ms: entry.durationMs,
    ...(entry.errorKind ? { error_kind: entry.errorKind } : {}),
    ...(entry.errorDetail
      ? { error_detail: entry.errorDetail.replace(/\s+/g, " ").slice(0, 200) }
      : {}),
  };
  // One line per stage keeps Vercel log search useful without flooding output.
  console.info(JSON.stringify(payload));
}

export function logRequestSummary(entry: {
  requestId: string;
  status: "completed" | "partial" | "failed";
  durationMs: number;
  checks: CheckStatus[];
  mode: string;
  bodyChars: number;
  referenceChars: number;
}): void {
  console.info(
    JSON.stringify({
      event: "analysis_request",
      request_id: entry.requestId,
      status: entry.status,
      duration_ms: entry.durationMs,
      mode: entry.mode,
      // Character counts only — never the content itself.
      body_chars: entry.bodyChars,
      reference_chars: entry.referenceChars,
      checks: entry.checks.map((c) => ({
        name: c.name,
        status: c.status,
        duration_ms: c.duration_ms ?? null,
      })),
    })
  );
}
