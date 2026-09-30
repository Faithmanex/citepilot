import { NextResponse } from "next/server";
import { aiConfig, SERVICE_VERSION } from "@/lib/ai/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json({
    status: "ok",
    service: "citepilot-ai",
    version: SERVICE_VERSION,
    ai_engine_ready: Boolean(aiConfig.googleApiKey),
    model: aiConfig.geminiModel,
  });
}
