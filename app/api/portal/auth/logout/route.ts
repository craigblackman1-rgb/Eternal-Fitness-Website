import { NextResponse } from "next/server";
import {
  destroyPortalSession,
  PORTAL_SESSION_COOKIE,
} from "@/lib/portal-auth";

export async function POST(request: Request) {
  const store = request.headers.get("cookie") ?? "";
  const match = store.match(new RegExp(`${PORTAL_SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  await destroyPortalSession(token);

  const res = NextResponse.redirect(new URL("/portal/login", new URL(request.url).origin));
  res.cookies.set(PORTAL_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
