import { NextResponse } from "next/server";
import { checkAuth, checkRateLimit } from "@/lib/ai/auth";
import { aiConfig, normalizeCitationStyle, ALLOWED_CITATION_STYLES } from "@/lib/ai/config";
import { parseDocument, parseTxtStructured, splitBodyAndReferences, UnsupportedFileTypeError } from "@/lib/ai/document-parser";
import { AIServiceError } from "@/lib/ai/llm";
import { logRequestSummary, newRequestId } from "@/lib/ai/log";
import { runAnalysisPipeline } from "@/lib/ai/pipeline";
import type { ParagraphMeta } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ErrorBody {
  detail: string;
  code: string;
  retryable: boolean;
  request_id: string;
}

function errorResponse(
  status: number,
  detail: string,
  code: string,
  retryable: boolean,
  requestId: string
): NextResponse {
  const body: ErrorBody = {
    detail,
    code,
    retryable,
    request_id: requestId,
  };
  return NextResponse.json(body, { status });
}

function normalizeMode(mode: string): "full" | "reference_only" | null {
  const m = (mode || "full").trim().toLowerCase();
  if (["reference_only", "references_only", "references"].includes(m)) return "reference_only";
  if (["full", "manuscript"].includes(m)) return "full";
  return null;
}

interface FileLike {
  name?: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

function isFileLike(value: unknown): value is FileLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as FileLike).arrayBuffer === "function"
  );
}

/**
 * Maps a provider failure to a user-facing response. Every failure preserves
 * the manuscript (the client never discards it) and says whether retrying can
 * help.
 */
function providerErrorResponse(err: AIServiceError, requestId: string): NextResponse {
  const preserved =
    "Your manuscript was not changed or discarded — it is still in the editor.";

  switch (err.kind) {
    case "invalid_config":
      return errorResponse(
        503,
        `The AI provider denied access to the analysis service, so the audit could not run. This is a credentials or project-permission problem; retrying will not help until an administrator fixes it. ${preserved}`,
        "ai_not_configured",
        false,
        requestId
      );
    case "budget_exhausted":
      return errorResponse(
        504,
        `Analysis did not finish within the time limit for this document. Try a shorter manuscript or reference list, then retry. ${preserved}`,
        "analysis_budget_exhausted",
        true,
        requestId
      );
    case "timeout":
      return errorResponse(
        504,
        `The AI provider timed out before the audit finished. Retrying is appropriate. ${preserved}`,
        "provider_timeout",
        true,
        requestId
      );
    case "rate_limit":
      return errorResponse(
        429,
        `The AI provider rate limit was reached. Wait about a minute, then retry. ${preserved}`,
        "provider_rate_limited",
        true,
        requestId
      );
    case "invalid_response":
      return errorResponse(
        502,
        `The AI provider returned a response the audit could not use. Retrying is appropriate. ${preserved}`,
        "provider_invalid_response",
        true,
        requestId
      );
    default:
      return errorResponse(
        503,
        `The AI provider is currently unavailable. Retrying shortly is appropriate. ${preserved}`,
        "provider_unavailable",
        true,
        requestId
      );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") || newRequestId();
  const authError = checkAuth(request);
  if (authError) return authError;
  const rateError = checkRateLimit(request);
  if (rateError) return rateError;

  const start = Date.now();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(
      400,
      "The request body was not valid multipart form data.",
      "invalid_request",
      false,
      requestId
    );
  }

  const textField = form.get("text");
  const fileField = form.get("file");
  const styleRawOrNull = form.get("citation_style");
  const modeRawOrNull = form.get("mode");

  const text = typeof textField === "string" ? textField : "";
  const style = normalizeCitationStyle(String(styleRawOrNull ?? "apa7"));

  const normMode = normalizeMode(String(modeRawOrNull ?? "full"));
  if (normMode === null) {
    return errorResponse(
      400,
      `Invalid mode '${modeRawOrNull}'. Allowed mode values: 'full', 'manuscript', 'reference_only', 'references_only'.`,
      "invalid_mode",
      false,
      requestId
    );
  }

  if (!style) {
    return errorResponse(
      400,
      `Invalid citation_style '${styleRawOrNull}'. Allowed: ${[...ALLOWED_CITATION_STYLES].sort().join(", ")}`,
      "invalid_citation_style",
      false,
      requestId
    );
  }

  const maxUploadBytes = aiConfig.maxUploadMb * 1024 * 1024;

  let bodyText = "";
  let refText = "";
  let paraMeta: ParagraphMeta[] = [];

  if (isFileLike(fileField)) {
    try {
      const arrayBuffer = await fileField.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length === 0) {
        return errorResponse(
          400,
          "The uploaded file is empty. Choose a file that contains text.",
          "empty_file",
          false,
          requestId
        );
      }
      if (buffer.length > maxUploadBytes) {
        return errorResponse(
          413,
          `File too large (${(buffer.length / (1024 * 1024)).toFixed(1)} MB). Maximum is ${aiConfig.maxUploadMb} MB.`,
          "file_too_large",
          false,
          requestId
        );
      }

      const filename = fileField.name || "upload";
      const mime = fileField.type || "";
      const parsed = await parseDocument(buffer, mime, filename, normMode);
      bodyText = parsed.bodyText;
      refText = parsed.refText;
      paraMeta = parsed.paragraphsMeta;

      if (bodyText.length + refText.length > aiConfig.maxTextChars) {
        return errorResponse(
          413,
          `Document too large after extraction. Maximum is ${aiConfig.maxTextChars.toLocaleString()} characters.`,
          "text_too_large",
          false,
          requestId
        );
      }
      if (!bodyText.trim() && !refText.trim()) {
        return errorResponse(
          422,
          "No text could be read from this file. It may be an image-only scan or an unsupported format. Try a DOCX, PDF with selectable text, TXT, RTF, or BibTeX file.",
          "unparseable_file",
          false,
          requestId
        );
      }
    } catch (err) {
      if (err instanceof UnsupportedFileTypeError) {
        return errorResponse(
          415,
          "That file type is not supported. Use a DOCX, PDF with selectable text, TXT, RTF, or BibTeX file.",
          "unsupported_file",
          false,
          requestId
        );
      }
      console.error(
        JSON.stringify({
          event: "document_parse_failed",
          request_id: requestId,
          error: (err as Error)?.name || "Error",
        })
      );
      return errorResponse(
        400,
        "This file could not be read. It may be corrupt or password-protected. Try re-saving it, or paste the text instead.",
        "corrupt_file",
        false,
        requestId
      );
    }
  } else if (text) {
    if (!text.trim()) {
      return errorResponse(
        400,
        "The pasted text is empty. Paste a manuscript or reference list first.",
        "empty_text",
        false,
        requestId
      );
    }
    if (text.length > aiConfig.maxTextChars) {
      return errorResponse(
        413,
        `Text too large (${text.length.toLocaleString()} chars). Maximum is ${aiConfig.maxTextChars.toLocaleString()} characters.`,
        "text_too_large",
        false,
        requestId
      );
    }
    if (normMode === "reference_only") {
      bodyText = "";
      refText = text.trim();
      paraMeta = parseTxtStructured(refText);
    } else {
      const split = splitBodyAndReferences(text);
      bodyText = split.bodyText;
      refText = split.refText;
      paraMeta = parseTxtStructured(bodyText);
    }
  } else {
    return errorResponse(
      400,
      "Provide manuscript text or a document file to analyse.",
      "missing_document",
      false,
      requestId
    );
  }

  try {
    const results = await runAnalysisPipeline(bodyText, refText, paraMeta, style, {
      requestId,
    });
    const elapsed = (Date.now() - start) / 1000;

    logRequestSummary({
      requestId,
      status: results.status,
      durationMs: Date.now() - start,
      checks: results.checks,
      mode: normMode,
      bodyChars: bodyText.length,
      referenceChars: refText.length,
    });

    return NextResponse.json({
      request_id: requestId,
      mode: normMode,
      citation_style: style,
      status: results.status,
      checks: results.checks,
      elapsed_seconds: Math.round(elapsed * 100) / 100,
      // Echo the analysed manuscript so findings can be shown against the text
      // (and edited) even when the document was uploaded as a file. When the
      // splitter found no reference heading, body and reference text are the
      // same string and must not be duplicated.
      manuscript_text:
        !bodyText ? refText : refText && refText !== bodyText
            ? `${bodyText}\n\nReferences\n\n${refText}`
            : bodyText,
      citations: results.citations,
      references: results.references,
      style_warnings: results.style_warnings,
      uncited_claims: results.uncited_claims,
      recency: results.recency,
    });
  } catch (err) {
    if (err instanceof AIServiceError) {
      console.error(
        JSON.stringify({
          event: "analysis_failed",
          request_id: requestId,
          error_kind: err.kind,
          error_detail: (err.providerDetail || err.message)
            .replace(/\s+/g, " ")
            .slice(0, 300),
          duration_ms: Date.now() - start,
        })
      );
      return providerErrorResponse(err, requestId);
    }
    console.error(
      JSON.stringify({
        event: "analysis_exception",
        request_id: requestId,
        duration_ms: Date.now() - start,
      })
    );
    return errorResponse(
      500,
      "The audit failed unexpectedly. Your manuscript is preserved; retrying is appropriate.",
      "analysis_failed",
      true,
      requestId
    );
  }
}
