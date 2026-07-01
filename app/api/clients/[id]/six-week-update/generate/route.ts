import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateSixWeekUpdate } from "@/lib/generate-six-week-update";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const draft = await generateSixWeekUpdate(parseInt(params.id));
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate update" },
      { status: 500 },
    );
  }
}
