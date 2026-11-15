import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("[PayPal Webhook] Failed to obtain PayPal access token:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token || null;
}

async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
  webhookId: string
): Promise<boolean> {
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const certId = headers.get("paypal-cert-id");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certId || !authAlgo || !transmissionSig) {
    console.warn("[PayPal Webhook] Missing PayPal transmission headers — rejecting");
    return false;
  }

  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    console.error("[PayPal Webhook] Cannot verify signature without PAYPAL_CLIENT_ID/SECRET");
    return false;
  }

  const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_id: certId,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  if (!verifyRes.ok) {
    console.error("[PayPal Webhook] verify-webhook-signature HTTP error:", verifyRes.status);
    return false;
  }
  const verifyData = (await verifyRes.json()) as { verification_status?: string };
  if (verifyData.verification_status !== "SUCCESS") {
    console.warn("[PayPal Webhook] Signature verification failed:", verifyData.verification_status);
    return false;
  }
  return true;
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  summary?: string;
  resource: {
    id?: string;
    billing_agreement_id?: string;
    plan_id?: string;
    subscriber?: {
      payer_id?: string;
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
    custom_id?: string;
    status?: string;
    start_time?: string;
    create_time?: string;
    update_time?: string;
    billing_info?: {
      next_billing_time?: string;
      last_payment?: { amount?: { value?: string; currency_code?: string } };
    };
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let event: PayPalWebhookEvent;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // --- PayPal webhook signature verification ---
    // A webhook is only trustworthy when PayPal's signature checks out. There
    // is no "dev mode" that accepts unsigned events: an unverified webhook
    // could grant a paid tier to anyone who can POST to this URL.
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error(
        "[PayPal Webhook] PAYPAL_WEBHOOK_ID is not set — rejecting webhook. Set PAYPAL_WEBHOOK_ID in Vercel env vars."
      );
      return NextResponse.json(
        { error: "Billing webhooks are not configured on this deployment" },
        { status: 503 }
      );
    }
    const verified = await verifyWebhookSignature(request.headers, rawBody, webhookId);
    if (!verified) {
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType} for resource ${resource.id || resource.billing_agreement_id}`);

    // A sale event's `resource.id` is the sale, not the subscription; the
    // subscription is carried in `billing_agreement_id`. Using the sale ID as a
    // subscription ID would create phantom records.
    const subscriptionId =
      eventType === "PAYMENT.SALE.COMPLETED"
        ? resource.billing_agreement_id
        : resource.id || resource.billing_agreement_id;
    const payerId = resource.subscriber?.payer_id;
    const payerEmail = resource.subscriber?.email_address;
    const customUserId = resource.custom_id;

    if (!subscriptionId) {
      return NextResponse.json({ received: true, message: "No subscription id found in event" });
    }

    // Find the user by custom_id (user.id or user.auth_user_id) or by payer email
    let targetUserId: string | null = null;

    if (customUserId) {
      const { data: userById } = await supabase
        .from("users")
        .select("id")
        .or(`id.eq.${customUserId},auth_user_id.eq.${customUserId}`)
        .maybeSingle();

      if (userById) {
        targetUserId = userById.id;
      }
    }

    if (!targetUserId && payerEmail) {
      const { data: userByEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", payerEmail.toLowerCase())
        .maybeSingle();

      if (userByEmail) {
        targetUserId = userByEmail.id;
      }
    }

    // If subscription already exists in DB, retrieve its user_id
    if (!targetUserId) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();

      if (existingSub) {
        targetUserId = existingSub.user_id;
      }
    }

    const nextBillingTime = resource.billing_info?.next_billing_time;
    const expectedPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;

    const ALLOWED_EVENTS = new Set([
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.RE-ACTIVATED",
      "PAYMENT.SALE.COMPLETED",
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "BILLING.SUBSCRIPTION.EXPIRED",
    ]);
    if (!ALLOWED_EVENTS.has(eventType)) {
      console.log(`[PayPal Webhook] Ignoring unsupported event type: ${eventType}`);
      return NextResponse.json({ received: true, event: eventType });
    }

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      case "PAYMENT.SALE.COMPLETED": {
        // Subscription events carry the plan they were created for. A webhook
        // for a plan CitePilot does not sell must not grant the paid tier.
        if (
          expectedPlanId &&
          resource.plan_id &&
          resource.plan_id !== expectedPlanId
        ) {
          console.warn(
            `[PayPal Webhook] plan mismatch for ${subscriptionId}: expected ${expectedPlanId}, got ${resource.plan_id} — ignoring`
          );
          return NextResponse.json({ received: true, ignored: "plan_mismatch" });
        }

        if (!targetUserId) {
          // Returning 2xx prevents an endless retry storm, but this event
          // granted nothing: surface it so the paid customer can be resolved
          // manually.
          console.error(
            `[PayPal Webhook] ${eventType} for subscription ${subscriptionId} could not be matched to a user (payer email: ${payerEmail || "none"}, custom_id: ${customUserId || "none"}). No tier was granted.`
          );
          return NextResponse.json({ received: true, unassigned: true });
        }

        const now = new Date().toISOString();
        // Only a real PayPal next-billing time is stored; inventing a 30-day
        // window would misstate the paid term.
        const { error: upsertErr } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: targetUserId,
              paypal_subscription_id: subscriptionId,
              paypal_payer_id: payerId,
              paypal_plan_id: resource.plan_id,
              tier: "professional",
              status: "active",
              current_period_start: resource.start_time || now,
              current_period_end: nextBillingTime || null,
              updated_at: now,
            },
            { onConflict: "user_id" }
          );
        if (upsertErr) {
          console.error("[PayPal Webhook] subscriptions upsert failed:", upsertErr);
          return NextResponse.json({ error: "Failed to persist subscription" }, { status: 500 });
        }

        const { error: userErr } = await supabase
          .from("users")
          .update({ tier: "professional", updated_at: now })
          .eq("id", targetUserId);
        if (userErr) {
          console.error("[PayPal Webhook] users tier update failed:", userErr);
          return NextResponse.json({ error: "Failed to update user tier" }, { status: 500 });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        if (targetUserId) {
          const now = new Date();
          // A cancelled subscription may still be paid up to the end of the
          // current period. Access follows what was paid for, not the moment
          // the cancellation arrived.
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("current_period_end")
            .eq("paypal_subscription_id", subscriptionId)
            .maybeSingle();
          const periodEnd = existing?.current_period_end
            ? new Date(existing.current_period_end)
            : null;
          const stillPaid = Boolean(periodEnd && periodEnd.getTime() > now.getTime());

          const { error: subErr } = await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              cancel_at_period_end: !stillPaid,
              tier: stillPaid ? "professional" : "free",
              updated_at: now.toISOString(),
            })
            .eq("paypal_subscription_id", subscriptionId);
          if (subErr) {
            console.error("[PayPal Webhook] subscriptions cancel update failed:", subErr);
            return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
          }

          // Only downgrade the profile once nothing remains paid. Otherwise the
          // tier stays until the period ends, and entitlement resolution
          // (lib/ai/entitlement.ts) applies the expiry lazily.
          if (!stillPaid) {
            const { error: userErr2 } = await supabase
              .from("users")
              .update({ tier: "free", updated_at: now.toISOString() })
              .eq("id", targetUserId);
            if (userErr2) {
              console.error("[PayPal Webhook] users tier downgrade failed:", userErr2);
              return NextResponse.json({ error: "Failed to update user tier" }, { status: 500 });
            }
          }
        }
        break;
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (err: unknown) {
    console.error("[PayPal Webhook Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler error" },
      { status: 500 }
    );
  }
}
