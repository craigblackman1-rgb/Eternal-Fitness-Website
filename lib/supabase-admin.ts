import { createPgClient } from "@/lib/pg-client";

/**
 * Service-role pg client — bypasses RLS. Use ONLY in server routes for
 * narrowly-scoped, unauthenticated flows (e.g. a client signing a document via
 * its unguessable UUID). Never import into client components.
 */
export function createAdminClient() {
  return createPgClient();
}
