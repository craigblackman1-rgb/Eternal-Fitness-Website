"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconEdit3, IconTrash2, IconSend } from "@/components/icons";
import { toast } from "sonner";

interface UpdateRowActionsProps {
  clientNumber: number;
  updateId: string;
  status: string;
  hasEmail: boolean;
}

/** Edit / Send-now / Delete controls for an update row. Edit + Send-now show only
 *  for draft/scheduled/failed; Delete is available on any update (incl. sent). */
export function UpdateRowActions({ clientNumber, updateId, status, hasEmail }: UpdateRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const editable = status === "draft" || status === "scheduled" || status === "failed";

  const handleSendNow = async () => {
    if (!hasEmail) return toast.error("This update has no recipient — open it to add one");
    if (!confirm("Send this update to the client now?")) return;
    setBusy("send");
    try {
      const res = await fetch(`/api/updates/${updateId}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send");
      toast.success(data.emailed ? "Update sent" : "Email sending isn't configured — logged without sending");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this ${status} update? This can't be undone.`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/updates/${updateId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      toast.success("Update deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {editable && (
        <>
          <Link href={`/hub/clients/${clientNumber}/updates/${updateId}/edit`}>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8" disabled={busy !== null}>
              <IconEdit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8" onClick={handleSendNow} disabled={busy !== null}>
            <IconSend className="h-3.5 w-3.5" />
            {busy === "send" ? "Sending…" : "Send now"}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={busy !== null}
        title="Delete"
      >
        <IconTrash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
