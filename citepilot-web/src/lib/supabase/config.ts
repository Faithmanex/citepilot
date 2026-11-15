/**
 * Shared Supabase configuration.
 *
 * There is deliberately no mock URL or key fallback: a missing configuration
 * must be visible as "authentication/history is not configured", never silently
 * pretend to be a working project.
 */
const configuredUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const configuredKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

export const supabaseUrl = configuredUrl;
export const supabaseAnonKey = configuredKey;

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Authentication and audit history are not configured on this deployment (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing).";
