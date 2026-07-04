"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconChevronLeft, IconSend, IconAlertTriangle, IconEye, IconEyeOff, IconSave, IconMail } from "@/components/icons";
import Link from "next/link";
import { toast } from "sonner";
import { UpdateChatPanel } from "./UpdateChatPanel";
import { RichTextEditor } from "@/components/hub/RichTextEditor";
import { UPDATE_TEMPLATE_KINDS, getTemplateKind } from "@/lib/email-templates/registry";
import { buildSixWeekUpdateHtml } from "@/lib/email-templates/six-week-update";
import type { SixWeekUpdateData } from "@/lib/email-templates/six-week-update";

const TEST_RECIPIENTS = [
  { label: "Craig (Decoded Ops)", email: "craig@decodedops.co.uk" },
  { label: "Esther", email: "esther.fair@eternalfitness.co.uk" },
];

type SectionValues = Record<string, string>;

interface NewUpdateClientProps {
  clientNumber: number;
  clientName: string;
  defaultEmail?: string;
  defaultEmailSource?: string;
}

/** Rebuild the branded email HTML from the edited section values, per kind. */
function buildHtmlForKind(_kind: string, clientName: string, sections: SectionValues): string {
  // Only one kind implemented today; the registry keeps section keys aligned
  // with SixWeekUpdateData, so a spread is safe.
  return buildSixWeekUpdateHtml({ clientName, ...sections } as unknown as SixWeekUpdateData);
}

export function NewUpdateClient({ clientNumber, clientName, defaultEmail = "", defaultEmailSource }: NewUpdateClientProps) {
  const router = useRouter();
  const [templateKind, setTemplateKind] = useState(UPDATE_TEMPLATE_KINDS[0].id);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [testingTo, setTestingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [subject, setSubject] = useState("");
  const [sections, setSections] = useState<SectionValues>({});
  const [clientEmail, setClientEmail] = useState(defaultEmail);
  const [showRaw, setShowRaw] = useState(false);

  const kind = getTemplateKind(templateKind);

  // Live-rebuild the full branded HTML whenever any section or subject changes.
  const html = useMemo(() => {
    if (!hasDraft) return "";
    return buildHtmlForKind(templateKind, clientName, sections);
  }, [hasDraft, templateKind, clientName, sections]);

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

      const draft = await res.json();
      // draft.data holds the structured sections (keys match kind.sections keys).
      const nextSections: SectionValues = {};
      for (const s of kind.sections) {
        nextSections[s.key] = draft.data?.[s.key] ?? "";
      }
      setSections(nextSections);
      setSubject(draft.subject ?? kind.defaultSubject);
      setHasDraft(true);
      toast.success("Draft created — edit any section below");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/clients/${clientNumber}/six-week-update/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html, templateKind, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
    return data;
  };

  const handleTestSend = async (email: string) => {
    setTestingTo(email);
    setError(null);
    try {
      const data = await post({ testRecipient: email });
      toast.success(data.emailed ? `Test sent to ${email}` : "SMTP not configured — test not sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setTestingTo(null);
    }
  };

  const handleSend = async (skipSend: boolean) => {
    if (!skipSend && !clientEmail.trim()) {
      toast.error("Enter the client's email address");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const data = await post({ clientEmail: clientEmail.trim(), skipSend });
      toast.success(skipSend ? "Update logged" : data.emailed ? "Update sent!" : "SMTP not configured — logged without sending");
      router.push(`/hub/clients/${clientNumber}/updates`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${clientNumber}/updates`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New Update</h1>
          <p className="text-muted-foreground">Chat through what to include, then edit and send</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!hasDraft && (
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

      {hasDraft && (
        <>
          {/* Editable content — per-section WYSIWYG */}
          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader>
              <CardTitle>Edit the email</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use the toolbar to format — no HTML needed. Changes update the preview live.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject line</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              {kind.sections.map((s) => (
                <div key={s.key} className="space-y-2">
                  <Label>{s.label}</Label>
                  <RichTextEditor
                    value={sections[s.key] ?? ""}
                    onChange={(v) => setSections((prev) => ({ ...prev, [s.key]: v }))}
                    placeholder={`Write the ${s.label.toLowerCase()} section…`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)} className="rounded-full gap-1.5">
                {showRaw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                {showRaw ? "Hide HTML" : "View HTML"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-border/60 rounded-xl overflow-hidden bg-[#F5F5F5]">
                <iframe srcDoc={html} title="Email preview" className="w-full" style={{ height: "640px", border: "none" }} />
              </div>
              {showRaw && (
                <Textarea value={html} readOnly rows={16} className="font-mono text-xs" />
              )}
            </CardContent>
          </Card>

          {/* Send */}
          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader>
              <CardTitle>Send</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Client email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                {defaultEmail && clientEmail === defaultEmail && (
                  <p className="text-xs text-muted-foreground">
                    Prefilled from {defaultEmailSource || "the client record"}. Edit if it&apos;s changed.
                  </p>
                )}
              </div>

              {/* Test send */}
              <div className="rounded-xl border border-[var(--hub-border)] bg-background p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <IconMail className="h-4 w-4 text-teal" />
                  Send a test first
                </div>
                <p className="text-xs text-muted-foreground">Check how it lands in a real inbox before it goes to the client.</p>
                <div className="flex flex-wrap gap-2">
                  {TEST_RECIPIENTS.map((t) => (
                    <Button
                      key={t.email}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSend(t.email)}
                      disabled={testingTo !== null || sending}
                      className="rounded-full gap-1.5"
                    >
                      <IconSend className="h-3.5 w-3.5" />
                      {testingTo === t.email ? "Sending…" : `Test to ${t.label}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasDraft(false);
                    setSections({});
                    setSubject("");
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
                    {sending ? "Sending…" : "Send to client"}
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
