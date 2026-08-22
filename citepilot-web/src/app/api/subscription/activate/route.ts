import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { subscriptionId, planId, tier = "professional" } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user id from public.users
    const { data: userProfile } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const targetUserId = userProfile?.id || user.id;

    // Upsert subscription
    await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: targetUserId,
          paypal_subscription_id: subscriptionId,
          paypal_plan_id: planId,
          tier,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Update user profile tier
    await admin
      .from("users")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

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
