import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: block } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const { error: sessionsError } = await supabase
    .from("sessions")
    .delete()
    .eq("block_id", params.id);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const { error: blockError } = await supabase
    .from("blocks")
    .delete()
    .eq("id", params.id);

  if (blockError) {
    return NextResponse.json({ error: blockError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
