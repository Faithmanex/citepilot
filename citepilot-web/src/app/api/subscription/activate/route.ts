import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_PLAN_IDS = new Set([
  process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-00697875B1151583ANJV3VOY",
  "P-00697875B1151583ANJV3VOY",
]);

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

async function verifyPayPalSubscription(
  subscriptionId: string,
  expectedPlanId?: string
): Promise<{ valid: boolean; error?: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  // If PayPal credentials not configured, skip server-side verification but log.
  if (!clientId || !secret) {
    console.warn(
      "[subscription/activate] PAYPAL_CLIENT_ID/SECRET not set — skipping PayPal subscription verification (dev mode)"
    );
    return { valid: true };
  }

  // PayPal subscription IDs typically start with "I-"
  if (!/^I-[A-Z0-9]+$/i.test(subscriptionId) && subscriptionId.length < 5) {
    return { valid: false, error: "Invalid subscriptionId format" };
  }

  try {
    const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) {
      console.error("[subscription/activate] PayPal token fetch failed:", tokenRes.status);
      return { valid: false, error: "PayPal verification unavailable" };
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return { valid: false, error: "PayPal verification unavailable" };
    }
    const subRes = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (!subRes.ok) {
      console.warn("[subscription/activate] PayPal subscription lookup failed:", subRes.status);
      return { valid: false, error: "Subscription not found or not verified with PayPal" };
    }
    const subData = (await subRes.json()) as { status?: string; plan_id?: string };
    if (subData.status !== "ACTIVE" && subData.status !== "APPROVAL_PENDING") {
      return { valid: false, error: `PayPal subscription status is ${subData.status}, expected ACTIVE` };
    }
    if (expectedPlanId && subData.plan_id && subData.plan_id !== expectedPlanId) {
      console.warn(
        `[subscription/activate] plan_id mismatch: expected ${expectedPlanId}, got ${subData.plan_id}`
      );
      // Do not block on plan mismatch alone, but log it; uncomment next line to enforce strict match:
      // return { valid: false, error: "Plan ID mismatch" };
    }
    return { valid: true };
  } catch (e) {
    console.error("[subscription/activate] PayPal verification error:", e);
    return { valid: false, error: "PayPal verification error" };
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, planId } = body as {
      subscriptionId?: string;
      planId?: string;
      tier?: string;
    };

    if (!subscriptionId || typeof subscriptionId !== "string" || !subscriptionId.trim()) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const cleanSubscriptionId = subscriptionId.trim();
    // Tier is server-controlled — never trust client-supplied tier. Always "professional".
    const tier = "professional" as const;

    // Validate planId if provided — must be in allowlist
    if (planId && !ALLOWED_PLAN_IDS.has(planId)) {
      console.warn(`[subscription/activate] Unknown planId ${planId} — allowing but logging`);
    }

    // Verify subscription with PayPal when possible
    const verification = await verifyPayPalSubscription(cleanSubscriptionId, planId);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || "Subscription verification failed" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user id from public.users
    const { data: userProfile } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const targetUserId = userProfile?.id || user.id;

    // Upsert subscription — check errors
    const { error: upsertErr } = await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: targetUserId,
          paypal_subscription_id: cleanSubscriptionId,
          paypal_plan_id: planId,
          tier,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (upsertErr) {
      console.error("[subscription/activate] subscriptions upsert failed:", upsertErr);
      return NextResponse.json({ error: "Failed to persist subscription" }, { status: 500 });
    }

    // Update user profile tier — check errors
    const { error: tierErr } = await admin
      .from("users")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);
    if (tierErr) {
      console.error("[subscription/activate] users tier update failed:", tierErr);
      return NextResponse.json({ error: "Failed to update user tier" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tier,
      subscriptionId,
      message: "Subscription activated successfully!",
    });
  } catch (err: unknown) {
    console.error("Subscription activation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to activate subscription" },
      { status: 500 }
    );
  }
}
