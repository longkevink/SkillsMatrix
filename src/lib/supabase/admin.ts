import "server-only";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured } from "./env";

export function getSupabaseAdminClient() {
  const { url, serviceRoleKey } = assertSupabaseConfigured();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
