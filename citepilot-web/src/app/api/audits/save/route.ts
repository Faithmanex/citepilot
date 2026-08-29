import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Authentication required to persist audit history." },
        { status: 401 }
      );
    }

    // Get user id from public.users
    const { data: userProfile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const body = await request.json();
    const {
      document_name = "Manuscript Audit",
      citation_style = "apa7",
      audit_mode = "full",
      word_count = 0,
      citation_count = 0,
      reference_count = 0,
      score = 100,
      results = {},
    } = body;

    if (!userProfile?.id) {
      return NextResponse.json(
        { error: "User profile not found. Please sign out and sign in again." },
        { status: 404 }
      );
    }

    const { data: insertedAudit, error: insertErr } = await supabase
      .from("audits")
      .insert({
        user_id: userProfile.id,
        document_name,
        citation_style,
        audit_mode,
        word_count,
        citation_count,
        reference_count,
        score,
        results,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Audit save error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, audit: insertedAudit });
  } catch (err: unknown) {
    console.error("Save audit endpoint exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error saving audit" },
      { status: 500 }
    );
  }
}
