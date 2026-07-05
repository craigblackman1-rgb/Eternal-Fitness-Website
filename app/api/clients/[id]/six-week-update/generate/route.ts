import { NextResponse } from "next/server";
import { getAuthenticatedUser, jsonError, unauthorized } from "@/lib/api";
import { generateSixWeekUpdate } from "@/lib/generate-six-week-update";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { conversationSummary, templateKind } = body as { conversationSummary?: string; templateKind?: string };

  if (templateKind && templateKind !== "six_week_update") {
    return jsonError(`Template kind "${templateKind}" is not implemented yet`, 400);
  }

  try {
    const draft = await generateSixWeekUpdate(parseInt(params.id), { conversationSummary });
    return NextResponse.json(draft);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to generate update", 500);
  }
}
