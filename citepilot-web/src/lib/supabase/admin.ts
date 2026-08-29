import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required in production. Set it in Vercel env vars and redeploy (npx vercel --prod from monorepo root)."
      );
    }
    // In dev/test allow fallback but warn loudly so misconfiguration is visible.
    console.warn(
      "[createAdminClient] SUPABASE_SERVICE_ROLE_KEY is not set — privileged writes will fail under RLS. Set it in .env.local for local dev or Vercel env vars for production."
    );
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Set it before calling createAdminClient."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
