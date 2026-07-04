"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconChevronLeft, IconSend, IconAlertTriangle, IconEye, IconEyeOff, IconSave } from "@/components/icons";
import Link from "next/link";
import { toast } from "sonner";
import { UpdateChatPanel } from "./UpdateChatPanel";
import { UPDATE_TEMPLATE_KINDS, getTemplateKind } from "@/lib/email-templates/registry";

type DraftState = {
  subject: string;
  html: string;
  generatedAt: string;
} | null;

interface NewUpdateClientProps {
  clientNumber: number;
  clientName: string;
}

export function NewUpdateClient({ clientNumber, clientName }: NewUpdateClientProps) {
  const router = useRouter();
  const [templateKind, setTemplateKind] = useState(UPDATE_TEMPLATE_KINDS[0].id);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const handleCreateDraft = async (conversationSummary: string) => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientNumber}/six-week-update/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKind, conversationSummary: conversationSummary || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate update");
      }

      const data = await res.json();
      setDraft({ subject: data.subject, html: data.html, generatedAt: data.generatedAt });
      toast.success("Draft created!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (skipSend: boolean) => {
    if (!draft) return;
    if (!skipSend && !clientEmail.trim()) {
      toast.error("Enter the client's email address");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientNumber}/six-week-update/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: draft.subject,
          html: draft.html,
          clientEmail: clientEmail.trim(),
          templateKind,
          skipSend,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send update");
      }

      toast.success(skipSend ? "Update logged" : data.emailed ? "Update sent!" : "SMTP not configured — logged without sending");
      router.push(`/hub/clients/${clientNumber}/updates`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  };

  const kind = getTemplateKind(templateKind);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${clientNumber}/updates`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New Update</h1>
          <p className="text-muted-foreground">Chat through what to include, then review and send</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!draft && (
        <>
          {UPDATE_TEMPLATE_KINDS.length > 1 && (
            <div className="space-y-2 max-w-xs">
              <Label>Template</Label>
              <Select value={templateKind} onValueChange={setTemplateKind}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPDATE_TEMPLATE_KINDS.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardContent className="pt-6">
              <UpdateChatPanel
                clientNumber={clientNumber}
                clientName={clientName}
                templateKind={templateKind}
                starterPrompts={kind.starterPrompts}
                generating={generating}
                onCreateDraft={handleCreateDraft}
              />
            </CardContent>
          </Card>
        </>
      )}

      {draft && (
        <>
          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Review Email</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)} className="rounded-full gap-1.5">
                {showRaw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                {showRaw ? "Show Preview" : "Show HTML"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              </div>

              {showRaw ? (
                <div className="space-y-2">
                  <Label>HTML Source</Label>
                  <Textarea
                    value={draft.html}
                    onChange={(e) => setDraft({ ...draft, html: e.target.value })}
                    rows={20}
                    className="font-mono text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <iframe srcDoc={draft.html} title="Email preview" className="w-full" style={{ height: "600px", border: "none" }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader>
              <CardTitle>Send</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Client Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setClientEmail("");
                  }}
                >
                  Discard
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => handleSend(true)} disabled={sending} className="gap-2">
                    <IconSave className="h-4 w-4" />
                    Save without sending
                  </Button>
                  <Button
                    onClick={() => handleSend(false)}
                    disabled={sending || !clientEmail.trim()}
                    className="gap-2 bg-rose hover:bg-rose/90 text-white"
                  >
                    <IconSend className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
