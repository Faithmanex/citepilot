import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "./config";

export function createAdminClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "mock-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
