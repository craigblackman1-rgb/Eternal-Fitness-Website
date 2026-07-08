import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/** Draft/scheduled/failed updates can be edited or deleted — sent ones are history. */
const EDITABLE = ["draft", "scheduled", "failed"];
/** Statuses a caller is allowed to move an editable record into. */
const SETTABLE = ["draft", "scheduled"];

export async function PATCH(request: Request, { params }: { params: { updateId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("sent_updates")
    .select("id, status")
    .eq("id", params.updateId)
    .single();

  if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });
  if (!EDITABLE.includes(existing.status)) {
    return NextResponse.json({ error: "Only draft or scheduled updates can be edited" }, { status: 409 });
  }

  const body = await request.json();
  const { subject, html, sections, clientEmail, blockNumber, status, scheduledFor } = body as {
    subject?: string;
    html?: string;
    sections?: Record<string, string>;
    clientEmail?: string;
    blockNumber?: number;
    status?: string;
    scheduledFor?: string | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (subject !== undefined) patch.subject = subject;
  if (html !== undefined) patch.body_html = html;
  if (sections !== undefined) patch.sections = sections;
  if (clientEmail !== undefined) patch.client_email = clientEmail;
  if (blockNumber !== undefined) patch.block_number = blockNumber;

  // Allow flipping between draft and scheduled (and rescheduling).
  if (status !== undefined) {
    if (!SETTABLE.includes(status)) {
      return NextResponse.json({ error: "status must be draft or scheduled" }, { status: 400 });
    }
    patch.status = status;
  }
  if (scheduledFor !== undefined) {
    if (scheduledFor === null) {
      patch.scheduled_for = null;
    } else {
      const when = new Date(scheduledFor);
      if (isNaN(when.getTime())) return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
      if (when.getTime() < Date.now() - 60_000) {
        return NextResponse.json({ error: "Scheduled time is in the past" }, { status: 400 });
      }
      patch.scheduled_for = when.toISOString();
    }
  }

  // Guard: a scheduled update must have both a time and a recipient.
  const finalStatus = (patch.status as string) ?? existing.status;
  if (finalStatus === "scheduled") {
    const finalScheduled = patch.scheduled_for !== undefined ? patch.scheduled_for : undefined;
    if (finalScheduled === null) {
      return NextResponse.json({ error: "A scheduled update needs a send time" }, { status: 400 });
    }
  }

  const { error } = await supabase.from("sent_updates").update(patch).eq("id", params.updateId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { updateId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Any update can be deleted — including sent history (Esther may want to tidy
  // up test rows or records logged in error). This is an intentional hard delete.
  const { data: existing } = await supabase
    .from("sent_updates")
    .select("id")
    .eq("id", params.updateId)
    .single();

  if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });

  const { error } = await supabase.from("sent_updates").delete().eq("id", params.updateId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
