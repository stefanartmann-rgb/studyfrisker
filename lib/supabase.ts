import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Generic Supabase client helper.
 *
 * Reads configuration from environment variables:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY  (server-only, elevated privileges)
 *
 * Server-side only — never import this into client components or expose
 * the service-role key to the browser.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * A Supabase client using the service-role key. Bypasses RLS — server-side only.
 */
export function createSupabaseServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
