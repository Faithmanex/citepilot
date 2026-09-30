import { NextResponse } from "next/server";
import { checkAuth, checkRateLimit } from "@/lib/ai/auth";
import { generatePdfReport } from "@/lib/ai/export";
import { PdfExportRequestSchema } from "@/lib/ai/schemas";
import type { JsonObject } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function resolveData(payload: Record<string, unknown>): JsonObject {
  const data = payload["data"];
  if (data && typeof data === "object") return data as JsonObject;
  const rest: JsonObject = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k !== "data") rest[k] = v;
  }
  return rest;
}

export async function POST(request: Request): Promise<NextResponse> {
  const authError = checkAuth(request);
  if (authError) return authError;
  const rateError = checkRateLimit(request);
  if (rateError) return rateError;

  try {
    const raw: unknown = await request.json();
    const parsed = PdfExportRequestSchema.safeParse(raw);
    const payload = parsed.success ? parsed.data : {};
    const data = resolveData(payload as Record<string, unknown>);
    const bytes = await generatePdfReport(data);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    console.error("PDF export failure:", err);
    return NextResponse.json(
      { detail: "Failed to generate PDF report export." },
      { status: 500 }
    );
  }
}
