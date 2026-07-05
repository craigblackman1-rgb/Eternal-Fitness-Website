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
import { IconChevronLeft, IconSend, IconAlertTriangle, IconEye, IconEyeOff, IconSave, IconMail, IconClock } from "@/components/icons";
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

/** Existing draft/scheduled record being edited (null = compose new). */
export interface EditableUpdate {
  id: string;
  status: "draft" | "scheduled";
  subject: string;
  sections: SectionValues;
  templateKind: string;
  blockNumber: number;
  clientEmail: string | null;
  scheduledFor: string | null;
}

interface NewUpdateClientProps {
  clientNumber: number;
  clientName: string;
  defaultEmail?: string;
  defaultEmailSource?: string;
  /** When present, the component edits this saved update instead of composing new. */
  existing?: EditableUpdate;
}

/** Rebuild the branded email HTML from the edited section values, per kind. */
function buildHtmlForKind(_kind: string, clientName: string, sections: SectionValues): string {
  return buildSixWeekUpdateHtml({ clientName, ...sections } as unknown as SixWeekUpdateData);
}

/** ISO -> value for <input type="datetime-local"> in the viewer's local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewUpdateClient({ clientNumber, clientName, defaultEmail = "", defaultEmailSource, existing }: NewUpdateClientProps) {
  const router = useRouter();
  const isEdit = !!existing;

  const [templateKind, setTemplateKind] = useState(existing?.templateKind ?? UPDATE_TEMPLATE_KINDS[0].id);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // which action is running
  const [testingTo, setTestingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(isEdit);
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [sections, setSections] = useState<SectionValues>(existing?.sections ?? {});
  const [blockNumber, setBlockNumber] = useState(existing?.blockNumber ?? 0);
  const [clientEmail, setClientEmail] = useState(existing?.clientEmail ?? defaultEmail);
  const [scheduledFor, setScheduledFor] = useState(toLocalInput(existing?.scheduledFor ?? null));
  const [showRaw, setShowRaw] = useState(false);

  const kind = getTemplateKind(templateKind);

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
      const nextSections: SectionValues = {};
      for (const s of kind.sections) nextSections[s.key] = draft.data?.[s.key] ?? "";
      setSections(nextSections);
      setSubject(draft.subject ?? kind.defaultSubject);
      setBlockNumber(draft.blockNumber ?? 0);
      setHasDraft(true);
      toast.success("Draft created — edit any section below");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  /** POST an action to the create endpoint (compose mode). */
  const postCreate = async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(`/api/clients/${clientNumber}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, subject, html, sections, blockNumber, templateKind, ...extra }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
    return data;
  };

  const handleTestSend = async (email: string) => {
    setTestingTo(email);
    setError(null);
    try {
      const data = await postCreate("test", { testRecipient: email });
      toast.success(data.emailed ? `Test sent to ${email}` : "Email sending isn't configured — test not sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setTestingTo(null);
    }
  };

  const goBack = () => router.push(`/hub/clients/${clientNumber}/updates`);

  // --- Compose-mode actions -------------------------------------------------

  const handleSendNow = async () => {
    if (!clientEmail.trim()) return toast.error("Enter the client's email address");
    setBusy("send");
    setError(null);
    try {
      if (isEdit) {
        // Persist the current editor content first — the send route emails the
        // saved html — then dispatch it now.
        await patchExisting({ clientEmail: clientEmail.trim() });
        const res = await fetch(`/api/updates/${existing!.id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientEmail: clientEmail.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
        toast.success(data.emailed ? "Update sent!" : "Email sending isn't configured — logged without sending");
      } else {
        const data = await postCreate("send", { clientEmail: clientEmail.trim() });
        toast.success(data.emailed ? "Update sent!" : "Email sending isn't configured — logged without sending");
      }
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  };

  const handleLog = async () => {
    setBusy("log");
    setError(null);
    try {
      await postCreate("log", { clientEmail: clientEmail.trim() || undefined });
      toast.success("Update logged");
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  };

  const handleSaveDraft = async () => {
    setBusy("draft");
    setError(null);
    try {
      if (isEdit) {
        await patchExisting({ status: "draft", scheduledFor: null });
        toast.success("Draft saved");
      } else {
        await postCreate("draft", { clientEmail: clientEmail.trim() || undefined });
        toast.success("Draft saved");
      }
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledFor) return toast.error("Pick a date and time to send");
    if (!clientEmail.trim()) return toast.error("Enter the client's email address");
    const iso = new Date(scheduledFor).toISOString();
    setBusy("schedule");
    setError(null);
    try {
      if (isEdit) {
        await patchExisting({ status: "scheduled", scheduledFor: iso });
        toast.success("Update rescheduled");
      } else {
        await postCreate("schedule", { clientEmail: clientEmail.trim(), scheduledFor: iso });
        toast.success("Update scheduled");
      }
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  };

  /** PATCH the saved record with the current editor content + status/schedule. */
  const patchExisting = async (extra: Record<string, unknown>) => {
    const res = await fetch(`/api/updates/${existing!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        html,
        sections,
        blockNumber,
        clientEmail: clientEmail.trim() || null,
        ...extra,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${clientNumber}/updates`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{isEdit ? "Edit Update" : "New Update"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Make your changes, then reschedule, save, or send" : "Chat through what to include, then edit and send"}
          </p>
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
              {showRaw && <Textarea value={html} readOnly rows={16} className="font-mono text-xs" />}
            </CardContent>
          </Card>

          {/* Send / schedule */}
          <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
            <CardHeader>
              <CardTitle>Send or schedule</CardTitle>
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

              {/* Schedule */}
              <div className="rounded-xl border border-[var(--hub-border)] bg-background p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <IconClock className="h-4 w-4 text-teal" />
                  Schedule for later
                </div>
                <p className="text-xs text-muted-foreground">
                  Pick a date and time and it&apos;ll send automatically. Leave blank to send now or save as a draft.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduledFor" className="text-xs">Send at</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSchedule}
                    disabled={busy !== null || !scheduledFor}
                    className="gap-2 rounded-full"
                  >
                    <IconClock className="h-4 w-4" />
                    {busy === "schedule" ? "Scheduling…" : isEdit && existing?.status === "scheduled" ? "Reschedule" : "Schedule send"}
                  </Button>
                </div>
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
                      disabled={testingTo !== null || busy !== null}
                      className="rounded-full gap-1.5"
                    >
                      <IconSend className="h-3.5 w-3.5" />
                      {testingTo === t.email ? "Sending…" : `Test to ${t.label}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-3 pt-1">
                <Button variant="outline" onClick={goBack} disabled={busy !== null}>
                  Cancel
                </Button>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={busy !== null} className="gap-2">
                    <IconSave className="h-4 w-4" />
                    {busy === "draft" ? "Saving…" : "Save draft"}
                  </Button>
                  <Button variant="outline" onClick={handleLog} disabled={busy !== null} className="gap-2">
                    <IconSave className="h-4 w-4" />
                    {busy === "log" ? "Logging…" : "Log without sending"}
                  </Button>
                  <Button
                    onClick={handleSendNow}
                    disabled={busy !== null || !clientEmail.trim()}
                    className="gap-2 bg-rose hover:bg-rose/90 text-white"
                  >
                    <IconSend className="h-4 w-4" />
                    {busy === "send" ? "Sending…" : "Send now"}
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
