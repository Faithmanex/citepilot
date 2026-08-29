import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeNextPath(next: string | null): string {
  if (!next) return "/dashboard";
  // Must be a path-absolute URL starting with "/" but not "//" and must not contain protocol tricks.
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  if (next.includes("://") || next.includes("@") || next.includes("\\")) return "/dashboard";
  // Allow only safe characters; block control chars
  if (/[\r\n]/.test(next)) return "/dashboard";
  return next;
}

function sanitizeForwardedHost(host: string | null): string | null {
  if (!host) return null;
  // Basic allowlist: must be a plausible hostname (letters, digits, hyphen, dot), no port tricks
  // In production this should be an explicit allowlist; here we validate shape and trust Vercel's header.
  const cleaned = host.trim().split(",")[0].trim();
  if (!/^[a-z0-9.-]+$/i.test(cleaned)) return null;
  if (cleaned.includes("..") || cleaned.startsWith("-") || cleaned.startsWith(".")) return null;
  // Optionally restrict to known domains: allow the app's own vercel/domain or localhost
  const allowedSuffixes = ["vercel.app", "citepilot.ai", "citepilot.com"];
  const isAllowed =
    cleaned === "localhost" ||
    cleaned.startsWith("localhost:") ||
    allowedSuffixes.some((s) => cleaned.endsWith(s)) ||
    process.env.NEXT_PUBLIC_APP_URL?.includes(cleaned);
  // If we have an explicit allowlist with env var, enforce it; otherwise accept shape-valid host
  // but log for visibility. For now accept shape-valid to avoid breaking previews.
  if (!isAllowed) {
    console.warn(`[auth/callback] forwardedHost "${cleaned}" not in allowlist — using origin fallback`);
    return null;
  }
  return cleaned;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === "development";
      const forwardedHost = sanitizeForwardedHost(request.headers.get("x-forwarded-host"));
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return user to login page with error param if code exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
