import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: { key: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value } = await request.json() as { value: unknown };

  if (value === undefined) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("plan_agent_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", params.key)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
