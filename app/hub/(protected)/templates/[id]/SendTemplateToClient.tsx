"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconSend } from "@/components/icons";
import { toast } from "sonner";
import Link from "next/link";
import type { DocumentKind } from "@/lib/documents/types";

interface ClientOption { client_number: number; name: string }

export function SendTemplateToClient({ kind, clients }: { kind: DocumentKind; clients: ClientOption[] }) {
  const [clientNumber, setClientNumber] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ clientNumber: number; docId: string; signUrl: string } | null>(null);

  const send = async () => {
    if (!clientNumber) { toast.error("Choose a client"); return; }
    setBusy(true);
    setResult(null);
    try {
      // Create the document from this template for the chosen client…
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientNumber: Number(clientNumber), kind }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || "Failed to create document");

      // …then mark it sent (stores the copy against the client).
      const sendRes = await fetch(`/api/documents/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      if (!sendRes.ok) throw new Error((await sendRes.json()).error || "Failed to send");

      const signUrl = `${window.location.origin}/documents/${created.id}/sign`;
      try { await navigator.clipboard.writeText(signUrl); } catch { /* ignore */ }
      setResult({ clientNumber: Number(clientNumber), docId: created.id, signUrl });
      toast.success("Document created & sign link copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Create this document for a client and get their signing link — the same as doing it from their profile. A copy is stored against them.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label>Client</Label>
          <Select value={clientNumber} onValueChange={setClientNumber}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choose a client…" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.client_number} value={String(c.client_number)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={send} disabled={busy} className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
          <IconSend className="h-4 w-4" />
          {busy ? "Sending…" : "Create & send"}
        </Button>
      </div>

      {result && (
        <div className="rounded-xl border border-[var(--hub-border)] bg-background p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Client signing link (copied to clipboard):</p>
          <Input readOnly value={result.signUrl} className="font-mono text-xs" />
          <div className="flex gap-3 text-xs">
            <Link href={`/hub/clients/${result.clientNumber}/documents/${result.docId}`} className="text-rose font-medium hover:underline">
              Open document
            </Link>
            <Link href={`/hub/clients/${result.clientNumber}/documents`} className="text-teal font-medium hover:underline">
              Client&apos;s documents
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
