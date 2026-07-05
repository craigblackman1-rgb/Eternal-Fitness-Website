import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/** JSON error response — `{ error }` with the given status. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** 401 JSON response used by every authenticated route. */
export function unauthorized() {
  return jsonError("Unauthorized", 401);
}

/** 404 JSON response. */
export function notFound(message = "Not found") {
  return jsonError(message, 404);
}

/**
 * Creates the request-scoped Supabase client and loads the current user.
 * Routes guard with: `const { supabase, user } = await getAuthenticatedUser();
 * if (!user) return unauthorized();`
 */
export async function getAuthenticatedUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

type ServerClient = ReturnType<typeof createClient>;

/** Common client columns, plus any others selected. */
type ClientRow = { id: string; name: string } & Record<string, unknown>;

/**
 * Resolves a public-facing `client_number` (string or number) to the client
 * record. Returns `null` when the number is missing/invalid or no row matches.
 */
export async function getClientByNumber<T = ClientRow>(
  supabase: ServerClient,
  clientNumber: string | number | null | undefined,
  columns = "*",
): Promise<T | null> {
  const num = typeof clientNumber === "string" ? parseInt(clientNumber) : clientNumber;
  if (num == null || Number.isNaN(num)) return null;

  const { data } = await supabase
    .from("clients")
    .select(columns)
    .eq("client_number", num)
    .single();

  return (data as unknown as T) ?? null;
}

/**
 * Loads the most recent signed PAR-Q for a client, matched either by the
 * `clients.id` FK or by the client's full name (public forms store the name).
 * Returns `null` when none exists.
 */
export async function getLatestSignedParq(
  supabase: ServerClient,
  filter: { clientId: string } | { fullName: string },
) {
  const query = supabase.from("signed_parq").select("*");
  const scoped =
    "clientId" in filter
      ? query.eq("client_id", filter.clientId)
      : query.eq("full_name", filter.fullName);

  const { data } = await scoped
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
