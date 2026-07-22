import { NextResponse } from "next/server";
import {
  verifyPortalLogin,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE,
} from "@/lib/portal-auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const ua = request.headers.get("user-agent") ?? undefined;

  const result = await verifyPortalLogin(body.email ?? "", body.password ?? "", {
    ipAddress: ip,
    userAgent: ua,
  });

  if (!result) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(PORTAL_SESSION_COOKIE, result.cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PORTAL_SESSION_MAX_AGE,
  });
  return res;
}
