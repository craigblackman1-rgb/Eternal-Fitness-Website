import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: block, error: fetchError } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (block.status !== "draft") {
    return NextResponse.json({ error: `Block is already ${block.status}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blocks")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
