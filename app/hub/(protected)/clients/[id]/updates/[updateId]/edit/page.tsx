import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { NewUpdateClient, type EditableUpdate } from "../../new/NewUpdateClient";
import type { SentUpdate } from "@/types";

export default async function EditUpdatePage({ params }: { params: { id: string; updateId: string } }) {
  const supabase = createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, client_number, name")
    .eq("client_number", parseInt(params.id))
    .single();
  if (!client) notFound();

  const { data: record } = await supabase
    .from("sent_updates")
    .select("*")
    .eq("id", params.updateId)
    .eq("client_id", client.id)
    .single();

  if (!record) notFound();
  const update = record as SentUpdate;

  // Draft/scheduled/failed updates are editable — a sent one is history.
  if (!["draft", "scheduled", "failed"].includes(update.status)) {
    notFound();
  }

  // A failed send reopens as a draft so it can be fixed and re-sent/rescheduled.
  const editStatus: "draft" | "scheduled" = update.status === "scheduled" ? "scheduled" : "draft";

  const existing: EditableUpdate = {
    id: update.id,
    status: editStatus,
    subject: update.subject,
    sections: update.sections ?? {},
    templateKind: update.template_kind,
    blockNumber: update.block_number,
    clientEmail: update.client_email,
    scheduledFor: update.scheduled_for,
  };

  return (
    <NewUpdateClient
      clientNumber={client.client_number}
      clientName={client.name}
      defaultEmail={update.client_email ?? ""}
      defaultEmailSource="this update"
      existing={existing}
    />
  );
}
