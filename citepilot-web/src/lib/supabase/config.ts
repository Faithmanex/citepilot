/**
 * Shared Supabase configuration.
 *
 * Uses local fallbacks so the app can boot in dev without env vars configured;
 * production deployments provide real values via NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-project.supabase.co";

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";
