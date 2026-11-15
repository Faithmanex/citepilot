import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./config";

/**
 * Returns null when Supabase is not configured. Callers must treat that as
 * "authentication unavailable" rather than talking to a placeholder project.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
