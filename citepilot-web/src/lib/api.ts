import type { AuditResponse } from "./types";
import type { AuditErrorCode } from "./auditState";

/**
 * Error surfaced by every API call. Carries the server's machine-readable code,
 * whether retrying can help, and the request id used in server logs.
 */
export class ApiError extends Error {
  readonly code: AuditErrorCode;
  readonly retryable: boolean;
  readonly requestId: string | null;
  readonly status: number | null;

  constructor(
    message: string,
    options: {
      code?: AuditErrorCode;
      retryable?: boolean;
      requestId?: string | null;
      status?: number | null;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code ?? "unknown";
    this.retryable = options.retryable ?? true;
    this.requestId = options.requestId ?? null;
    this.status = options.status ?? null;
  }
}

function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  // Same-origin Next.js Route Handlers. No external host fallback.
  return typeof window !== "undefined"
    ? `${window.location.origin}/api/v1`
    : "/api/v1";
}

const KNOWN_CODES = new Set<string>([
  "ai_not_configured",
  "analysis_budget_exhausted",
  "provider_timeout",
  "provider_rate_limited",
  "provider_invalid_response",
  "provider_unavailable",
  "invalid_mode",
  "invalid_citation_style",
  "invalid_request",
  "empty_file",
  "file_too_large",
  "text_too_large",
  "unparseable_file",
  "unsupported_file",
  "corrupt_file",
  "empty_text",
  "missing_document",
  "analysis_failed",
]);

function toAuditCode(code: unknown): AuditErrorCode {
  return typeof code === "string" && KNOWN_CODES.has(code)
    ? (code as AuditErrorCode)
    : "unknown";
}

/** True when the browser reported a network-level failure (never reached us). */
function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

async function request(
  url: string,
  init?: RequestInit,
  fallbackError = "API request failed"
): Promise<Response> {
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (err) {
    if (isNetworkError(err)) {
      throw new ApiError(
        "Could not reach the analysis service. Check your connection and retry.",
        { code: "network_error", retryable: true }
      );
    }
    throw err;
  }

  if (!resp.ok) {
    let errorMsg = fallbackError;
    let code: AuditErrorCode = "unknown";
    let retryable = resp.status >= 500 || resp.status === 429;
    let requestId: string | null = null;
    try {
      const errData = await resp.json();
      errorMsg = errData.detail || errData.message || errorMsg;
      code = toAuditCode(errData.code);
      if (typeof errData.retryable === "boolean") retryable = errData.retryable;
      requestId = errData.request_id || null;
      // 4xx validation errors are never retryable, even without a code.
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
        retryable = false;
      }
    } catch {
      /* keep defaults */
    }
    throw new ApiError(errorMsg, {
      code,
      retryable,
      requestId,
      status: resp.status,
    });
  }
  return resp;
}

export async function runAudit(
  formData: FormData,
  options: { signal?: AbortSignal; requestId?: string } = {}
): Promise<AuditResponse> {
  const resp = await request(
    `${getApiBase()}/analyse`,
    {
      method: "POST",
      body: formData,
      signal: options.signal,
      ...(options.requestId
        ? { headers: { "x-request-id": options.requestId } }
        : {}),
    },
    "API server returned error"
  );
  return resp.json();
}

export async function exportPdf(data: AuditResponse): Promise<Blob> {
  const resp = await request(
    `${getApiBase()}/export/pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Export PDF failed"
  );
  return resp.blob();
}

export async function exportDocx(
  text: string,
  analysisData?: AuditResponse | null,
  mode: "clean" | "redline" = "redline"
): Promise<Blob> {
  const resp = await request(
    `${getApiBase()}/export/docx`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, analysis_data: analysisData || {}, mode }),
    },
    "Export DOCX failed"
  );
  return resp.blob();
}
