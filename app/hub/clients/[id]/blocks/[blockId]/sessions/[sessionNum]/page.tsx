"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { DBSession, Exercise } from "@/types";

export default function SessionViewPage({
  params,
}: {
  params: { id: string; blockId: string; sessionNum: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<DBSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [coachingNotes, setCoachingNotes] = useState("");

  const sessionNum = parseInt(params.sessionNum);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("block_id", params.blockId)
        .eq("session_number", sessionNum)
        .single();

      setSession(data);
      setCoachingNotes(data?.data?.coaching_notes || "");
      setLoading(false);
    }
    load();
  }, [params.blockId, sessionNum]);

  const saveNotes = async () => {
    if (!session) return;
    const updatedData = { ...session.data, coaching_notes: coachingNotes };

    const { error } = await supabase
      .from("sessions")
      .update({ data: updatedData })
      .eq("id", session.id);

    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    setEditingNotes(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!session) {
    return <div className="p-8 text-center text-muted-foreground">Session not found</div>;
  }

  const archetypeNames: Record<string, string> = {
    A: "Mobility & Movement Quality",
    B: "Strength & Stability",
    C: "Power & Conditioning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/hub/clients/${params.id}/blocks/${params.blockId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Session {sessionNum}</h1>
            <Badge variant="outline" className="text-sm">
              {session.archetype}
            </Badge>
            <span className="text-sm capitalize text-muted-foreground">
              Week {session.week} · {session.phase}
            </span>
          </div>
          <p className="text-muted-foreground">{archetypeNames[session.archetype]}</p>
        </div>
        <div className="flex gap-2">
          {sessionNum > 1 && (
            <Link
              href={`/hub/clients/${params.id}/blocks/${params.blockId}/sessions/${sessionNum - 1}`}
            >
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {sessionNum < 18 && (
            <Link
              href={`/hub/clients/${params.id}/blocks/${params.blockId}/sessions/${sessionNum + 1}`}
            >
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {session.data?.client_intro && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-4">
            <p className="text-sm italic text-muted-foreground">Client intro</p>
            <p className="mt-1">{session.data.client_intro}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">Studio Version</TabsTrigger>
          <TabsTrigger value="home">Home Version</TabsTrigger>
        </TabsList>

        {(["studio", "home"] as const).map((version) => (
          <TabsContent key={version} value={version} className="space-y-6">
            <SessionSection title="Warm-up" exercises={session.data?.versions?.[version]?.warm_up || []} />
            <SessionSection title="Main Block" exercises={session.data?.versions?.[version]?.main_block || []} />
            <SessionSection title="Cool-down" exercises={session.data?.versions?.[version]?.cooldown || []} />
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coaching Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingNotes ? (
            <>
              <Textarea
                value={coachingNotes}
                onChange={(e) => setCoachingNotes(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={saveNotes}>Save</Button>
                <Button variant="outline" onClick={() => setEditingNotes(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{coachingNotes || "No notes yet"}</p>
              <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
                Edit Notes
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionSection({ title, exercises }: { title: string; exercises: Exercise[] }) {
  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No exercises</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="rounded-md border p-3 text-sm">
              <div className="flex items-start justify-between">
                <p className="font-medium">{ex.exercise_name}</p>
                <span className="text-xs text-muted-foreground">
                  {ex.sets}×{ex.reps}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                {ex.rest && <span>Rest: {ex.rest}</span>}
                {ex.equipment?.length > 0 && <span>Equipment: {ex.equipment.join(", ")}</span>}
              </div>
              {ex.coaching_cue && (
                <p className="mt-1 text-xs italic">{ex.coaching_cue}</p>
              )}
              {ex.modification && (
                <p className="mt-1 text-xs text-amber-700">
                  Mod: {ex.modification}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
