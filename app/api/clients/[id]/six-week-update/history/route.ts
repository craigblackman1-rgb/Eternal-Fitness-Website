import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientNumber = parseInt(params.id);

  // Resolve client_number to UUID
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("client_number", clientNumber)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: updates, error } = await supabase
    .from("sent_updates")
    .select("*")
    .eq("client_id", client.id)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updates);
}
