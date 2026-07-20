/**
 * Server-side portal session helper for Next.js server components / route
 * handlers. Reads the isolated portal session cookie (never the staff cookie)
 * and resolves the authenticated client identity. All portal data access must
 * filter by `session.clientId` — enforced here and in every portal route.
 */

import { cookies } from "next/headers";
import {
  getPortalSession,
  PORTAL_SESSION_COOKIE,
  type PortalSession,
} from "@/lib/portal-auth";

export { PORTAL_SESSION_COOKIE };

/** Resolve the current portal session (null if not authenticated). */
export async function getPortalSessionFromCookies(): Promise<PortalSession | null> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE)?.value;
  return getPortalSession(token);
}
