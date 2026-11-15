import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

/**
 * Billing is not configured on this deployment. Activation must fail closed:
 * never grant a paid tier on the strength of a client-supplied ID.
 */
const BILLING_NOT_CONFIGURED =
  "Billing is not configured on this deployment (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / NEXT_PUBLIC_PAYPAL_PLAN_ID are missing). Subscription activation is unavailable.";

interface PayPalSubscription {
  status?: string;
  plan_id?: string;
  start_time?: string;
  billing_info?: { next_billing_time?: string };
}

type Verification =
  | { ok: true; subscription: PayPalSubscription }
  | { ok: false; status: number; error: string };

async function getPayPalAccessToken(
  clientId: string,
  secret: string
): Promise<string | null> {
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
    console.error(
      "[subscription/activate] PayPal token fetch failed:",
      tokenRes.status
    );
    return null;
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  return tokenData.access_token || null;
}

/**
 * Confirms the subscription exists in PayPal, is active, and belongs to the
 * plan this product sells. The PayPal response — not the request body — is the
 * source of truth for plan, status, and billing period.
 */
async function verifyPayPalSubscription(
  subscriptionId: string,
  expectedPlanId: string
): Promise<Verification> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    return { ok: false, status: 503, error: BILLING_NOT_CONFIGURED };
  }

  let accessToken: string | null = null;
  try {
    accessToken = await getPayPalAccessToken(clientId, secret);
  } catch (e) {
    console.error("[subscription/activate] PayPal token error:", e);
  }
  if (!accessToken) {
    return {
      ok: false,
      status: 503,
      error: "PayPal is unreachable, so this subscription could not be verified. Try again shortly.",
    };
  }

  try {
    const subRes = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (subRes.status === 404) {
      return {
        ok: false,
        status: 400,
        error: "PayPal has no subscription with that ID.",
      };
    }
    if (!subRes.ok) {
      console.error(
        "[subscription/activate] PayPal subscription lookup failed:",
        subRes.status
      );
      return {
        ok: false,
        status: 503,
        error: "PayPal could not be reached to verify this subscription. Try again shortly.",
      };
    }

    const subscription = (await subRes.json()) as PayPalSubscription;

    if (subscription.status !== "ACTIVE") {
      return {
        ok: false,
        status: 400,
        error: `This PayPal subscription is ${subscription.status || "not active"}, not ACTIVE. Complete payment approval first.`,
      };
    }

    if (subscription.plan_id !== expectedPlanId) {
      console.warn(
        `[subscription/activate] plan mismatch: expected ${expectedPlanId}, PayPal reports ${subscription.plan_id}`
      );
      return {
        ok: false,
        status: 400,
        error: "This subscription is for a different plan than the one CitePilot sells.",
      };
    }

    return { ok: true, subscription };
  } catch (e) {
    console.error("[subscription/activate] PayPal verification error:", e);
    return {
      ok: false,
      status: 503,
      error: "PayPal verification failed. Try again shortly.",
    };
  }
}

export async function POST(request: Request) {
  try {
    const expectedPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
    if (!expectedPlanId) {
      console.error(
        "[subscription/activate] NEXT_PUBLIC_PAYPAL_PLAN_ID is not set — refusing activation."
      );
      return NextResponse.json(
        { error: BILLING_NOT_CONFIGURED },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      subscriptionId?: unknown;
      planId?: unknown;
      tier?: unknown;
    };

    const subscriptionId =
      typeof body.subscriptionId === "string" ? body.subscriptionId.trim() : "";
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscriptionId" },
        { status: 400 }
      );
    }

    // The client's planId is only a claim. PayPal's report is authoritative.
    if (typeof body.planId === "string" && body.planId !== expectedPlanId) {
      return NextResponse.json(
        { error: "This subscription is for a different plan than the one CitePilot sells." },
        { status: 400 }
      );
    }

    const verification = await verifyPayPalSubscription(
      subscriptionId,
      expectedPlanId
    );
    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status }
      );
    }

    // Tier is server-controlled — never trust client-supplied tier.
    const tier = "professional" as const;
    const admin = createAdminClient();

    const { data: userProfile, error: profileErr } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (profileErr) {
      console.error(
        "[subscription/activate] user lookup failed:",
        profileErr
      );
      return NextResponse.json(
        { error: "Failed to look up the signed-in user" },
        { status: 500 }
      );
    }

    const targetUserId = userProfile?.id || user.id;
    const now = new Date().toISOString();

    const { error: upsertErr } = await admin.from("subscriptions").upsert(
      {
        user_id: targetUserId,
        paypal_subscription_id: subscriptionId,
        paypal_plan_id: verification.subscription.plan_id,
        tier,
        status: "active",
        current_period_start:
          verification.subscription.start_time || now,
        // Only a real PayPal next-billing time is stored; when PayPal does not
        // report one, the column stays null rather than inventing a period.
        current_period_end:
          verification.subscription.billing_info?.next_billing_time || null,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );
    if (upsertErr) {
      console.error(
        "[subscription/activate] subscriptions upsert failed:",
        upsertErr
      );
      return NextResponse.json(
        { error: "Failed to persist subscription" },
        { status: 500 }
      );
    }

    const { error: tierErr } = await admin
      .from("users")
      .update({ tier, updated_at: now })
      .eq("id", targetUserId);
    if (tierErr) {
      console.error(
        "[subscription/activate] users tier update failed:",
        tierErr
      );
      return NextResponse.json(
        { error: "Failed to update user tier" },
        { status: 500 }
      );
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
