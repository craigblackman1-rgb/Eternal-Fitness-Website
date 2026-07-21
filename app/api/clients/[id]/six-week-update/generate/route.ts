import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateUpdateDraft } from "@/lib/generate-six-week-update";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { conversationSummary, templateKind } = body as { conversationSummary?: string; templateKind?: string };

  try {
    const draft = await generateUpdateDraft(parseInt(params.id), templateKind || "six_week_update", { conversationSummary });
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate update" },
      { status: 500 },
    );
  }
}
