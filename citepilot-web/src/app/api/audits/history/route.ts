import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ audits: [] });
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ audits: [] });
    }

    const { data: audits, error: fetchErr } = await supabase
      .from("audits")
      .select("id, document_name, citation_style, audit_mode, word_count, citation_count, reference_count, score, created_at, results")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ audits: audits || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load audit history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve public.users id for ownership check
    const { data: userProfile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get("id");

    if (!auditId) {
      return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
    }

    const { error: deleteErr } = await supabase
      .from("audits")
      .delete()
      .eq("id", auditId)
      .eq("user_id", userProfile.id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete audit" },
      { status: 500 }
    );
  }
}
