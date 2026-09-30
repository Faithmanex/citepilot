import { NextResponse } from "next/server";
import { checkAuth, checkRateLimit } from "@/lib/ai/auth";
import { aiConfig, ALLOWED_CITATION_STYLES } from "@/lib/ai/config";
import { parseDocument, parseTxtStructured, splitBodyAndReferences } from "@/lib/ai/document-parser";
import { AIServiceError } from "@/lib/ai/llm";
import { runAnalysisPipeline } from "@/lib/ai/pipeline";
import type { ParagraphMeta } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function errorResponse(status: number, detail: string): NextResponse {
  return NextResponse.json({ detail }, { status });
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

export async function POST(request: Request): Promise<NextResponse> {
  const authError = checkAuth(request);
  if (authError) return authError;
  const rateError = checkRateLimit(request);
  if (rateError) return rateError;

  const start = Date.now();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, "Invalid multipart form data.");
  }

  const textField = form.get("text");
  const fileField = form.get("file");
  const styleRawOrNull = form.get("citation_style");
  const modeRawOrNull = form.get("mode");

  const text = typeof textField === "string" ? textField : "";
  const style = String(styleRawOrNull ?? "apa7").trim().toLowerCase();

  const normMode = normalizeMode(String(modeRawOrNull ?? "full"));
  if (normMode === null) {
    return errorResponse(
      400,
      `Invalid mode '${modeRawOrNull}'. Allowed mode values: 'full', 'manuscript', 'reference_only', 'references_only'.`
    );
  }

  if (!ALLOWED_CITATION_STYLES.has(style)) {
    return errorResponse(
      400,
      `Invalid citation_style '${styleRawOrNull}'. Allowed: ${[...ALLOWED_CITATION_STYLES].sort().join(", ")}`
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
        return errorResponse(400, "Uploaded file is empty.");
      }
      if (buffer.length > maxUploadBytes) {
        return errorResponse(
          413,
          `File too large (${buffer.length} bytes). Maximum is ${aiConfig.maxUploadMb} MB.`
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
          `Document too large after extraction. Maximum is ${aiConfig.maxTextChars.toLocaleString()} characters.`
        );
      }
    } catch (err) {
      console.error("Document parse error:", err);
      return errorResponse(400, "Invalid or corrupt document file.");
    }
  } else if (text) {
    if (!text.trim()) {
      return errorResponse(400, "Provided text is empty.");
    }
    if (text.length > aiConfig.maxTextChars) {
      return errorResponse(
        413,
        `Text too large (${text.length.toLocaleString()} chars). Maximum is ${aiConfig.maxTextChars.toLocaleString()} characters.`
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
    return errorResponse(400, "Either 'text' or 'file' must be provided.");
  }

  try {
    const results = await runAnalysisPipeline(bodyText, refText, paraMeta, style);
    const elapsed = (Date.now() - start) / 1000;

    return NextResponse.json({
      mode: normMode,
      elapsed_seconds: Math.round(elapsed * 100) / 100,
      citations: results.citations,
      references: results.references,
      style_warnings: results.style_warnings,
      uncited_claims: results.uncited_claims,
      recency: results.recency,
    });
  } catch (err) {
    if (err instanceof AIServiceError) {
      console.error("AI Service Failure during document analysis:", err);
      return errorResponse(
        503,
        "AI Processing Service is currently unavailable. Please try again shortly."
      );
    }
    console.error("Analysis pipeline error:", err);
    return errorResponse(500, "Analysis failed. Please try again shortly.");
  }
}
