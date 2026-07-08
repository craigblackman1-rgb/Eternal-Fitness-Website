import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolves a ?client=<client_number> query value to the clients.id UUID, used to
 * attach public-form submissions (PAR-Q, agreement) to the right client record. */
export async function resolveClientId(
  supabase: SupabaseClient,
  clientNumber: unknown,
): Promise<string | null> {
  const num = Number(clientNumber);
  if (!clientNumber || Number.isNaN(num)) return null;

  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("client_number", num)
    .maybeSingle();

  return data?.id ?? null;
}
