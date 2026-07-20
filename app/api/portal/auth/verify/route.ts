import { NextResponse } from "next/server";
import {
  verifyPortalMagicLink,
  destroyPortalSession,
  PortalAuthError,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE,
} from "@/lib/portal-auth";

/**
 * GET /api/portal/auth/verify?token=...
 * Verifies a magic link, consumes it (single-use), and sets the isolated
 * portal session cookie. Returns a redirect to /portal (or errorCallbackURL).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const errorUrl = url.searchParams.get("errorCallbackURL") ?? "/portal/login?error=invalid";

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = request.headers.get("user-agent") ?? null;
    const { cookieValue } = await verifyPortalMagicLink(token, { ipAddress: ip, userAgent: ua });

    const res = NextResponse.redirect(new URL("/portal", url.origin));
    res.cookies.set(PORTAL_SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PORTAL_SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    const message = err instanceof PortalAuthError ? err.message : "Sign-in failed. Please try again.";
    const sep = errorUrl.includes("?") ? "&" : "?";
    return NextResponse.redirect(new URL(`${errorUrl}${sep}detail=${encodeURIComponent(message)}`, url.origin));
  }
}

/** POST /api/portal/auth/logout — clears the portal session. */
export async function POST(request: Request) {
  const store = request.headers.get("cookie") ?? "";
  const match = store.match(new RegExp(`${PORTAL_SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  await destroyPortalSession(token);

  const res = NextResponse.redirect(new URL("/portal/login", new URL(request.url).origin));
  res.cookies.set(PORTAL_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
