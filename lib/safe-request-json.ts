import { NextResponse } from "next/server";

/**
 * Safely parse a Request body as JSON, returning a structured error response
 * if the body is missing or malformed instead of letting the route crash.
 */
export async function safeRequestJson<T = unknown>(
  request: Request,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or missing JSON body" },
        { status: 400 },
      ),
    };
  }
}
