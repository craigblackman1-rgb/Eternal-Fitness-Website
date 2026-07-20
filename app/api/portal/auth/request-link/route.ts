import { NextResponse } from "next/server";
import {
  requestPortalMagicLink,
  PortalAuthError,
} from "@/lib/portal-auth";

/**
 * POST /api/portal/auth/request-link
 * Body: { email: string }
 * Requests a magic sign-in link. Always returns { requested: true } so the
 * response cannot be used to enumerate client accounts. The link is emailed
 * only when an email backend is configured; otherwise it is returned as
 * `devLink` for staff review and is NEVER auto-emitted to a real client.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = request.headers.get("user-agent") ?? null;
    const result = await requestPortalMagicLink(body.email ?? "", { ipAddress: ip, userAgent: ua });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof PortalAuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not process your request. Please try again." }, { status: 500 });
  }
}
