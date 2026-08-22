import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const supabase = createAdminClient();
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType} for resource ${resource.id || resource.billing_agreement_id}`);

    const subscriptionId = resource.id || resource.billing_agreement_id;
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

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      case "PAYMENT.SALE.COMPLETED": {
        if (targetUserId) {
          // Upsert subscription record
          await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: targetUserId,
                paypal_subscription_id: subscriptionId,
                paypal_payer_id: payerId,
                paypal_plan_id: resource.plan_id,
                tier: "professional",
                status: "active",
                current_period_start: resource.start_time || new Date().toISOString(),
                current_period_end: nextBillingTime || new Date(Date.now() + 30 * 86400000).toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

          // Update user tier
          await supabase
            .from("users")
            .update({ tier: "professional", updated_at: new Date().toISOString() })
            .eq("id", targetUserId);
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        if (targetUserId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("paypal_subscription_id", subscriptionId);

          await supabase
            .from("users")
            .update({ tier: "free", updated_at: new Date().toISOString() })
            .eq("id", targetUserId);
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
