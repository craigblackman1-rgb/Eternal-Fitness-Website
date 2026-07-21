"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconMail, IconSend } from "@/components/icons";
import { toast } from "sonner";

interface SendDocumentLinkProps {
  path: "/parq" | "/agreement";
  clientNumber: number;
  label: string;
  /** When set, link the client to their existing document to update it, not a blank form. */
  existingId?: string;
  /** Signed 7-day link params (minted server-side) for the existing-document link. */
  exp?: number;
  sig?: string;
  /** Client's email on file — enables the real "Email" send action. Copy-link stays available without it. */
  clientEmail?: string | null;
}

/** PRIMARY = actually email the client the link (only wired up for PAR-Q so far).
 *  SECONDARY = copy the link to the clipboard for manual sending (text, WhatsApp). */
export function SendDocumentLink({ path, clientNumber, label, existingId, exp, sig, clientEmail }: SendDocumentLinkProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const hasEmail = Boolean(clientEmail && clientEmail.trim());
  const canEmail = path === "/parq";

  const buildUrl = () =>
    existingId && exp && sig
      ? `${window.location.origin}${path}/edit/${existingId}?exp=${exp}&sig=${sig}`
      : `${window.location.origin}${path}?client=${clientNumber}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(buildUrl());
    toast.success(
      existingId && exp && sig
        ? "Fresh 7-day link to the client's PAR-Q copied — send it so they can update it"
        : `${label} link copied — send it to the client`,
    );
  };

  const sendEmail = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/parq/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientNumber, parqId: existingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      toast.success(data.dryRun ? "Email queued (dry run — no email backend configured)" : `Email sent to ${clientEmail}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  if (!canEmail) {
    return (
      <Button variant="outline" size="sm" onClick={copyLink} className="rounded-lg gap-1.5 border-border/60 h-7 px-2.5 text-xs">
        <IconMail className="h-3 w-3" />
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={sendEmail}
        disabled={sending || !hasEmail}
        title={hasEmail ? undefined : "No email address on file for this client"}
        className="rounded-lg gap-1.5 border-border/60 h-7 px-2.5 text-xs disabled:opacity-50"
      >
        <IconMail className="h-3 w-3" />
        {sending ? "Sending…" : `Email ${label.replace(/^Send /i, "")}`}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyLink}
        title="Copy link"
        className="rounded-lg h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
      >
        <IconSend className="h-3 w-3" />
      </Button>
    </div>
  );
}
