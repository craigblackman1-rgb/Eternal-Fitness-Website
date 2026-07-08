import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase env vars not configured");
    }
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

// Lazily initialized so importing this module never throws at build time
// (NEXT_PUBLIC_SUPABASE_* vars aren't available during static generation unless
// baked in as Docker build-args — see Coolify build-time env config).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
