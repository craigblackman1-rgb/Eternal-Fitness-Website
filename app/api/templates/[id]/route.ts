import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { safeRequestJson } from "@/lib/safe-request-json";

// Edit a document template (name, body, signature requirements, active flag).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await safeRequestJson<{ name?: string; body?: string; requires_client_signature?: boolean; requires_trainer_signature?: boolean; is_active?: boolean }>(request);
  if ("error" in parsed) return parsed.error;
  const { name, body, requires_client_signature, requires_trainer_signature, is_active } = parsed.data;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (body !== undefined) update.body = body;
  if (requires_client_signature !== undefined) update.requires_client_signature = requires_client_signature;
  if (requires_trainer_signature !== undefined) update.requires_trainer_signature = requires_trainer_signature;
  if (is_active !== undefined) update.is_active = is_active;

  const { error } = await supabase.from("document_templates").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
