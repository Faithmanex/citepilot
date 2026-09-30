import { NextResponse } from "next/server";
import { checkAuth, checkRateLimit } from "@/lib/ai/auth";
import { generateCleanDocx, generateRedlineDocx } from "@/lib/ai/export";
import { DocxExportRequestSchema } from "@/lib/ai/schemas";
import type { JsonObject } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: Request): Promise<NextResponse> {
  const authError = checkAuth(request);
  if (authError) return authError;
  const rateError = checkRateLimit(request);
  if (rateError) return rateError;

  try {
    const raw: unknown = await request.json();
    const parsed = DocxExportRequestSchema.safeParse(raw);
    const payload = parsed.success ? parsed.data : { text: "", analysis_data: {}, mode: "redline" };

    let analysisData: JsonObject = payload.analysis_data as JsonObject;
    if (!analysisData || Object.keys(analysisData).length === 0) {
      const extra: JsonObject = {};
      for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
        if (["citations", "references", "style_warnings", "uncited_claims", "recency"].includes(k)) {
          extra[k] = v;
        }
      }
      if (Object.keys(extra).length > 0) analysisData = extra;
    }

    const bytes =
      payload.mode === "clean"
        ? await generateCleanDocx(payload.text)
        : await generateRedlineDocx(payload.text, analysisData);

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: { "Content-Type": DOCX_MIME },
    });
  } catch (err) {
    console.error("DOCX export failure:", err);
    return NextResponse.json(
      { detail: "Failed to generate DOCX export." },
      { status: 500 }
    );
  }
}
