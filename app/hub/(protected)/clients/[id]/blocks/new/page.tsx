"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { IconAlertTriangle, IconChevronLeft, IconSparkles } from "@/components/icons";
import Link from "next/link";
import { toast } from "sonner";

export default function NewBlockPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [blockNote, setBlockNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/claude/generate-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: params.id, blockNote: blockNote.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate block");
      }

      const { blockId } = await res.json();
      toast.success("Block generated!");
      router.push(`/hub/clients/${params.id}/blocks/${blockId}/review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${params.id}`} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate New Block</h1>
          <p className="text-muted-foreground">The AI will create a bespoke plan based on the client profile and schedule</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm border-border/60 rounded-2xl">
        <CardHeader>
          <CardTitle>Block Note (optional)</CardTitle>
          <CardDescription>
            Add any context the AI should know — recent progress, changes in health, focus areas for this block
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note for the AI</Label>
            <Textarea
              id="note"
              placeholder='e.g. "Shoulder improving — cautious overhead ok. Increase lower body load."'
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              rows={4}
            />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Before generating</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>The client profile (health, goals, contraindications) will be sent to Claude AI</li>
              <li>Every exercise will include client-specific modifications</li>
              <li>The block starts as "draft" — you must review and approve before use</li>
              <li>You can edit any session manually after generation</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <Link href={`/hub/clients/${params.id}`}>
              <Button variant="outline" className="rounded-full border-border/60">Cancel</Button>
            </Link>
            <Button onClick={handleGenerate} disabled={generating} className="rounded-full gap-2 bg-rose hover:bg-rose/90 text-white">
              <IconSparkles className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Block"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
