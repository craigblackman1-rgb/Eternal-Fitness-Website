import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Portal session cookie name (kept in sync with lib/portal-auth.ts).
const PORTAL_COOKIE = "better_auth_portal_session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasStaffSession = !!getSessionCookie(request);

  const publicHubPaths = ["/hub/login", "/hub/forgot-password", "/hub/reset-password"];

  // --- Staff/trainer guard (unchanged, /hub + /admin) ----------------------
  if (
    !hasStaffSession &&
    (pathname.startsWith("/hub") || pathname.startsWith("/admin")) &&
    !publicHubPaths.includes(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub/login";
    return NextResponse.redirect(url);
  }

  // --- Client portal guard (ADDITIVE — does not touch staff rules) ---------
  // The portal uses its own cookie, isolated from the staff session.
  if (pathname.startsWith("/portal") && pathname !== "/portal/login") {
    const hasPortalSession = !!request.cookies.get(PORTAL_COOKIE)?.value;
    if (!hasPortalSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Hub/admin guard + portal guard must both run.
  matcher: ["/hub/:path*", "/admin/:path*", "/portal/:path*"],
};
