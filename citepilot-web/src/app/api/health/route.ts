import { NextResponse } from "next/server";
import { buildHealthPayload } from "@/lib/ai/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + provider readiness.
 *
 * `status` only describes the process. Analysis availability is reported
 * separately: a configured key is *not* treated as a working provider. Pass
 * `?probe=1` to run a real (cached) provider check.
 */
export async function GET(request: Request): Promise<NextResponse> {
  return NextResponse.json(await buildHealthPayload(request));
}
