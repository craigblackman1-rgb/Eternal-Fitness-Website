"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconMail, IconCopy, IconTrash2 } from "@/components/icons";
import { toast } from "sonner";

interface DocumentRowActionsProps {
  docId: string;
  status: string;
  hasEmail: boolean;
  clientName?: string | null;
}

/** Inline Send/Resend/Copy-link/Delete for a document row — same "click Send
 *  now" pattern as UpdateRowActions, so this doesn't require opening the
 *  document first. Used on both the client profile's document register and
 *  the hub-wide All Documents list. */
export function DocumentRowActions({ docId, status, hasEmail, clientName }: DocumentRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const signUrl = typeof window !== "undefined" ? `${window.location.origin}/documents/${docId}/sign` : "";
  const locked = status === "signed" || status === "superseded";

  const sendEmail = async () => {
    if (!hasEmail) return toast.error(`No email address on file for ${clientName || "this client"} — add one on the client record, or use Copy link.`);
    setBusy("send");
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast.success(data.dryRun ? "Email queued (dry run — no email backend configured)" : "Email sent");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signUrl);
      toast.success("Sign link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const deleteDoc = async () => {
    if (!confirm(`Delete this ${status} document? This can't be undone.`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      toast.success("Document deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
      {!locked && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasEmail || busy !== null}
            onClick={sendEmail}
            title={hasEmail ? undefined : `No email on file for ${clientName || "this client"}`}
            className="rounded-lg gap-1.5 h-7 px-2.5 text-xs disabled:opacity-50"
          >
            <IconMail className="h-3 w-3" />
            {busy === "send" ? "…" : status === "draft" ? "Send" : "Resend"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyLink}
            title="Copy sign link"
            className="rounded-lg h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <IconCopy className="h-3 w-3" />
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={deleteDoc}
        disabled={busy !== null}
        title="Delete document"
        className="rounded-lg h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      >
        <IconTrash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
