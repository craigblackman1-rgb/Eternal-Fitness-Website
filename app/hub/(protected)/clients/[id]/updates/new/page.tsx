"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconChevronLeft, IconSparkles, IconSend, IconAlertTriangle, IconEye, IconEyeOff } from "@/components/icons";
import Link from "next/link";
import { toast } from "sonner";

type DraftState = {
  subject: string;
  html: string;
  generatedAt: string;
} | null;

export default function NewUpdatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${params.id}/six-week-update/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate update");
      }

      const data = await res.json();
      setDraft({
        subject: data.subject,
        html: data.html,
        generatedAt: data.generatedAt,
      });
      toast.success("Update draft generated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draft) return;
    if (!clientEmail.trim()) {
      toast.error("Enter the client's email address");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${params.id}/six-week-update/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: draft.subject,
          html: draft.html,
          clientEmail: clientEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send update");
      }

      toast.success("Update sent!");
      router.push(`/hub/clients/${params.id}/updates`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${params.id}/updates`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New 6-Week Update</h1>
          <p className="text-muted-foreground">Generate a draft from training data, review it, then send</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Generate */}
      {!draft && (
        <Card className="shadow-sm border-border/60 rounded-2xl">
          <CardHeader>
            <CardTitle>Generate Update Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">What will be included</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Client profile data (goals, health, observations)</li>
                <li>Completed block summaries (attendance, movements introduced)</li>
                <li>Next block focus areas</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <Link href={`/hub/clients/${params.id}/updates`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                <IconSparkles className="h-4 w-4" />
                {generating ? "Generating..." : "Generate Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review + Send */}
      {draft && (
        <>
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Review Email</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="rounded-full gap-1.5"
              >
                {showRaw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                {showRaw ? "Show Preview" : "Show HTML"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                />
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
                    <iframe
                      srcDoc={draft.html}
                      title="Email preview"
                      className="w-full"
                      style={{ height: "600px", border: "none" }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 rounded-2xl">
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
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setClientEmail("");
                  }}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !clientEmail.trim()}
                  className="gap-2 bg-rose hover:bg-rose/90 text-white"
                >
                  <IconSend className="h-4 w-4" />
                  {sending ? "Sending..." : "Send Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
