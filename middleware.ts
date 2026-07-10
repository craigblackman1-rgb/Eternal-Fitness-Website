import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasSession = !!getSessionCookie(request);

  const publicHubPaths = ["/hub/login", "/hub/forgot-password", "/hub/reset-password"];

  if (
    !hasSession &&
    (pathname.startsWith("/hub") || pathname.startsWith("/admin")) &&
    !publicHubPaths.includes(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*"],
};
