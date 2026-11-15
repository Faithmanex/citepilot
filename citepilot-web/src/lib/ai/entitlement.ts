/**
 * Server-side audit entitlement.
 *
 * The word limit used to live only in the browser (see `@/lib/gating`), which
 * meant any direct POST to /api/v1/analyse bypassed it. Entitlement is resolved
 * here from the session's own profile row, which the client cannot write.
 */
import { FREE_TIER_WORD_LIMIT, countWords } from "@/lib/gating";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PRO_TIERS = new Set(["student", "professional", "institutional"]);

export type EntitlementTier =
  | "anonymous"
  | "free"
  | "student"
  | "professional"
  | "institutional";

export interface AuditEntitlement {
  tier: EntitlementTier;
  isPro: boolean;
  /** Maximum words accepted in one audit; `Infinity` for paid tiers. */
  wordLimit: number;
}

const ANONYMOUS: AuditEntitlement = {
  tier: "anonymous",
  isPro: false,
  wordLimit: FREE_TIER_WORD_LIMIT,
};

/** Maps a stored tier to its limits. Unknown tiers get the free limit. */
export function entitlementForTier(tier: string): AuditEntitlement {
  if (PRO_TIERS.has(tier)) {
    return { tier: tier as EntitlementTier, isPro: true, wordLimit: Infinity };
  }
  return { tier: "free", isPro: false, wordLimit: FREE_TIER_WORD_LIMIT };
}

/**
 * Applies expiry to a paid tier. A `users.tier` value can outlive the paid
 * period (cancellation, failed renewal, missed webhook), so the subscription
 * row — when one exists — decides whether the tier is still paid for.
 */
async function isStillPaid(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string
): Promise<boolean> {
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", profileId)
    .maybeSingle();

  // No subscription row: the tier came from another entitlement source (for
  // example an institutional or student account) and is left alone.
  if (error || !sub) return true;

  if (sub.status !== "active") {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    return Boolean(periodEnd && periodEnd.getTime() > Date.now());
  }

  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  return !periodEnd || periodEnd.getTime() > Date.now();
}

/**
 * Resolves the caller's entitlement from Supabase. Any failure — not
 * configured, no session, unreadable profile — resolves to the free limit
 * rather than to unlimited access.
 */
export async function resolveAuditEntitlement(): Promise<AuditEntitlement> {
  if (!isSupabaseConfigured) return ANONYMOUS;

  try {
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) return ANONYMOUS;

    // Read the tier with the service role so row-level security cannot mask it.
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("users")
      .select("id, tier")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error || !profile) {
      console.warn(
        "[analyse] Could not read the caller's tier; applying the free-tier limit:",
        error?.message || "no profile row"
      );
      return { ...ANONYMOUS, tier: "free" };
    }

    const entitlement = entitlementForTier(String(profile.tier || "free"));
    if (!entitlement.isPro) return entitlement;

    const paid = await isStillPaid(admin, String(profile.id));
    if (!paid) {
      console.warn(
        `[analyse] Tier '${entitlement.tier}' has expired for user ${profile.id}; applying the free-tier limit.`
      );
      return { ...ANONYMOUS, tier: "free" };
    }
    return entitlement;
  } catch (err) {
    console.warn(
      "[analyse] Entitlement lookup failed; applying the free-tier limit:",
      err instanceof Error ? err.message : err
    );
    return { ...ANONYMOUS, tier: "free" };
  }
}

export interface LimitCheck {
  allowed: boolean;
  wordCount: number;
  limit: number;
}

/** Applies the entitlement's word limit to the text about to be analysed. */
export function checkWordLimit(
  text: string,
  entitlement: AuditEntitlement
): LimitCheck {
  const wordCount = countWords(text);
  return {
    allowed: wordCount <= entitlement.wordLimit,
    wordCount,
    limit: entitlement.wordLimit,
  };
}
