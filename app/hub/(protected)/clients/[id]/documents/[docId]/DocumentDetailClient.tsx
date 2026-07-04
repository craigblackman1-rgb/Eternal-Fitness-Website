"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IconChevronLeft, IconSend, IconSave, IconMail, IconFileText } from "@/components/icons";
import { RichTextEditor } from "@/components/hub/RichTextEditor";
import { toast } from "sonner";
import type { ClientDocument, DocumentBody } from "@/lib/documents/types";

const readOnlyStatuses = ["signed", "superseded"];

export function DocumentDetailClient({ clientNumber, doc }: { clientNumber: number; doc: ClientDocument }) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [body, setBody] = useState<DocumentBody>(doc.body);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState(doc.trainer_name ?? "Esther Fair");
  const [trainerSig, setTrainerSig] = useState(doc.trainer_signature ?? "");

  const locked = readOnlyStatuses.includes(doc.status);
  const signUrl = typeof window !== "undefined" ? `${window.location.origin}/documents/${doc.id}/sign` : "";

  const setSection = (id: string, html: string) =>
    setBody((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, html } : s)) }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const act = async (label: string, run: () => Promise<Response>, done: (data: unknown) => void) => {
    setBusy(label);
    try {
      const res = await run();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      done(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const send = () =>
    act("send", () => fetch(`/api/documents/${doc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send" }),
    }), async () => {
      try { await navigator.clipboard.writeText(signUrl); } catch { /* ignore */ }
      toast.success("Marked as sent — client sign link copied");
      router.refresh();
    });

  const signAsTrainer = () => {
    if (!trainerSig.trim()) { toast.error("Type your signature"); return; }
    act("trainer-sign", () => fetch(`/api/documents/${doc.id}/sign`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "trainer", name: trainerName, signature: trainerSig }),
    }), () => { toast.success("Signed as trainer"); router.refresh(); });
  };

  const newVersion = () =>
    act("version", () => fetch(`/api/documents/${doc.id}/version`, { method: "POST" }),
      (data) => router.push(`/hub/clients/${clientNumber}/documents/${(data as { id: string }).id}`));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${clientNumber}/documents`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="rounded-full text-xs capitalize">{doc.status}</Badge>
            <Badge variant="outline" className="rounded-full text-xs">v{doc.version}</Badge>
          </div>
        </div>
        {locked && (
          <Button variant="outline" onClick={newVersion} disabled={busy !== null} className="rounded-full gap-1.5">
            <IconFileText className="h-4 w-4" />
            {busy === "version" ? "…" : "New version"}
          </Button>
        )}
      </div>

      {/* Edit */}
      <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{locked ? "Document" : "Edit document"}</CardTitle>
          {!locked && (
            <Button variant="outline" size="sm" onClick={save} disabled={saving} className="rounded-full gap-1.5">
              <IconSave className="h-4 w-4" />{saving ? "Saving…" : "Save"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} />
          </div>
          {body.intro && (
            <div
              className="text-sm text-muted-foreground rounded-lg bg-background border border-[var(--hub-border)] p-3 [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: body.intro }}
            />
          )}
          {body.sections.map((s) => (
            <div key={s.id} className="space-y-2">
              <Label>{s.title}</Label>
              {locked ? (
                <div className="text-sm text-muted-foreground rounded-lg bg-background border border-[var(--hub-border)] p-3" dangerouslySetInnerHTML={{ __html: s.html }} />
              ) : (
                <RichTextEditor value={s.html} onChange={(html) => setSection(s.id, html)} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
        <CardHeader><CardTitle>Signatures</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Client: </span>
            {doc.client_signature
              ? <span className="text-foreground font-medium">Signed by {doc.client_name} on {doc.client_signed_date}</span>
              : <span className="text-muted-foreground">Awaiting client signature</span>}
          </div>
          {doc.requires_trainer_signature && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Trainer: </span>
                {doc.trainer_signature
                  ? <span className="text-foreground font-medium">Signed by {doc.trainer_name} on {doc.trainer_signed_date}</span>
                  : <span className="text-muted-foreground">Not yet signed</span>}
              </div>
              {!doc.trainer_signature && !locked && (
                <div className="flex items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type your signature</Label>
                    <Input value={trainerSig} onChange={(e) => setTrainerSig(e.target.value)} placeholder={trainerName} className="w-64" />
                  </div>
                  <Button onClick={signAsTrainer} disabled={busy !== null} className="bg-teal hover:bg-teal/90 text-white rounded-full">
                    {busy === "trainer-sign" ? "…" : "Sign as trainer"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send */}
      {!locked && (
        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardHeader><CardTitle>Send to client</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Copy the client&apos;s signing link and send it to them. They open it, read the document, and sign.</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={signUrl} className="font-mono text-xs" />
              <Button onClick={send} disabled={busy !== null} className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white shrink-0">
                {doc.status === "draft" ? <IconSend className="h-4 w-4" /> : <IconMail className="h-4 w-4" />}
                {busy === "send" ? "…" : doc.status === "draft" ? "Mark sent & copy link" : "Copy link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
