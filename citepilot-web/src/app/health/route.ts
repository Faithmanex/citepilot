import { NextResponse } from "next/server";
import { buildHealthPayload } from "@/lib/ai/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Root liveness alias — same contract as `/api/health`. */
export async function GET(request: Request): Promise<NextResponse> {
  return NextResponse.json(await buildHealthPayload(request));
}
