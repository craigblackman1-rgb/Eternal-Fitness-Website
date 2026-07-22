import { NextResponse } from "next/server";
import {
  requestPasswordReset,
  PortalAuthError,
} from "@/lib/portal-auth";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await requestPasswordReset(body.email ?? "");
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof PortalAuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not process your request. Please try again." }, { status: 500 });
  }
}
