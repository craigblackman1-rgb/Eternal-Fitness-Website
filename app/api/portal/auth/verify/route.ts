import { NextResponse } from "next/server";
import {
  resetPortalPassword,
  PortalAuthError,
} from "@/lib/portal-auth";

export async function POST(request: Request) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    await resetPortalPassword(body.token ?? "", body.newPassword ?? "");
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof PortalAuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }
}
