"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Video, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { DBSession, Exercise } from "@/types";
import type { ExerciseEntry } from "@/app/hub/(protected)/exercises/page";
import { SwapExerciseDialog } from "../swap-exercise-dialog";

export default function SessionViewPage({
  params,
}: {
  params: { id: string; blockId: string; sessionNum: string };
}) {
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!session) return <div className="p-8 text-center text-muted-foreground">Session not found</div>;

  const archetypeNames: Record<string, string> = {
    A: "Mobility & Movement Quality",
    B: "Strength & Stability",
    C: "Power & Conditioning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}`} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Session {sessionNum}</h1>
            <Badge variant="outline" className="text-sm">{session.archetype}</Badge>
            <span className="text-sm capitalize text-muted-foreground">Week {session.week} · {session.phase}</span>
          </div>
          <p className="text-muted-foreground">{archetypeNames[session.archetype]}</p>
        </div>
        <div className="flex gap-2">
          {sessionNum > 1 && (
            <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}/sessions/${sessionNum - 1}`}>
              <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            </Link>
          )}
          {sessionNum < 18 && (
            <Link href={`/hub/clients/${params.id}/blocks/${params.blockId}/sessions/${sessionNum + 1}`}>
              <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
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
            <SessionSection
              title="Warm-up"
              exercises={session.data?.versions?.[version]?.warm_up || []}
              versionKey={version}
              sectionKey="warm_up"
              session={session}
              onUpdateSession={setSession}
            />
            <SessionSection
              title="Main Block"
              exercises={session.data?.versions?.[version]?.main_block || []}
              versionKey={version}
              sectionKey="main_block"
              session={session}
              onUpdateSession={setSession}
            />
            <SessionSection
              title="Cool-down"
              exercises={session.data?.versions?.[version]?.cooldown || []}
              versionKey={version}
              sectionKey="cooldown"
              session={session}
              onUpdateSession={setSession}
            />
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
              <Textarea value={coachingNotes} onChange={(e) => setCoachingNotes(e.target.value)} rows={4} />
              <div className="flex gap-2">
                <Button onClick={saveNotes}>Save</Button>
                <Button variant="outline" onClick={() => setEditingNotes(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{coachingNotes || "No notes yet"}</p>
              <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>Edit Notes</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionSection({
  title,
  exercises,
  versionKey,
  sectionKey,
  session,
  onUpdateSession,
}: {
  title: string;
  exercises: Exercise[];
  versionKey: string;
  sectionKey: string;
  session: DBSession;
  onUpdateSession: (s: DBSession) => void;
}) {
  const supabase = createClient();
  const [editingUrl, setEditingUrl] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [swapping, setSwapping] = useState<number | null>(null);

  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No exercises</p></CardContent>
      </Card>
    );
  }

  const updateExerciseMedia = async (idx: number, videoUrl: string) => {
    const updatedData = { ...session.data };
    const exercise = (updatedData.versions as any)[versionKey][sectionKey][idx] as Exercise;
    exercise.media = { ...exercise.media, video_url: videoUrl };
    (updatedData.versions as any)[versionKey][sectionKey][idx] = exercise;

    const { error } = await supabase
      .from("sessions")
      .update({ data: updatedData })
      .eq("id", session.id);

    if (error) {
      toast.error("Failed to save");
      return;
    }

    onUpdateSession({ ...session, data: updatedData });
    toast.success("Video saved");
    setEditingUrl(null);
    setUrlInput("");
  };

  const searchYoutube = (name: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise")}`;
    window.open(url, "_blank");
  };

  const handleSwapExercise = async (idx: number, selected: ExerciseEntry) => {
    const updatedData = { ...session.data };
    const exercise = (updatedData.versions as any)[versionKey][sectionKey][idx] as Exercise;
    exercise.exercise_name = selected.name;
    exercise.coaching_cue = selected.coaching_cue;
    exercise.modification = selected.default_mod;
    exercise.equipment = selected.equipment;
    if (selected.media) {
      exercise.media = { ...exercise.media, ...selected.media };
    }
    (updatedData.versions as any)[versionKey][sectionKey][idx] = exercise;

    const { error } = await supabase
      .from("sessions")
      .update({ data: updatedData })
      .eq("id", session.id);

    if (error) {
      toast.error("Failed to swap exercise");
      return;
    }

    onUpdateSession({ ...session, data: updatedData });
    toast.success(`Swapped to ${selected.name}`);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="rounded-md border p-3 text-sm">
              <div className="flex items-start justify-between">
                <p className="font-medium">{ex.exercise_name}</p>
                <span className="text-xs text-muted-foreground">{ex.sets}×{ex.reps}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                {ex.rest && <span>Rest: {ex.rest}</span>}
                {ex.equipment?.length > 0 && <span>Equipment: {ex.equipment.join(", ")}</span>}
              </div>
              {ex.coaching_cue && <p className="mt-1 text-xs italic">{ex.coaching_cue}</p>}
              {ex.modification && <p className="mt-1 text-xs text-amber-700">Mod: {ex.modification}</p>}

              <div className="mt-2 flex items-center gap-2">
                {ex.media?.video_url ? (
                  <>
                    <a
                      href={ex.media.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <Video className="h-3 w-3" />
                      Watch
                    </a>
                    <span className="text-xs text-muted-foreground">|</span>
                    <button
                      onClick={() => {
                        setEditingUrl(editingUrl === i ? null : i);
                        setUrlInput(ex.media?.video_url || "");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingUrl(editingUrl === i ? null : i);
                      setUrlInput("");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Video className="h-3 w-3" />
                    Add video
                  </button>
                )}
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  onClick={() => searchYoutube(ex.exercise_name)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Search YouTube
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  onClick={() => setSwapping(swapping === i ? null : i)}
                  className="text-xs text-accent hover:underline"
                >
                  Swap
                </button>
              </div>

              {swapping === i && (
                <SwapExerciseDialog
                  open={swapping === i}
                  onOpenChange={(open) => { if (!open) setSwapping(null); }}
                  onSelect={(selected) => handleSwapExercise(i, selected)}
                />
              )}

              {editingUrl === i && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="YouTube or video URL..."
                    className="min-w-0 flex-1 rounded-md border px-2 py-1 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && updateExerciseMedia(i, urlInput.trim())}
                  />
                  <button
                    onClick={() => updateExerciseMedia(i, urlInput.trim())}
                    className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
