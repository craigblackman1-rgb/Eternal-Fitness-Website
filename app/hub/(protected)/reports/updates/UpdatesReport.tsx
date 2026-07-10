"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconSearch, IconEye, IconEdit3, IconTrash2, IconMail, IconClock, IconExternalLink } from "@/components/icons";
import { updateStatusMeta, formatUpdateTime } from "@/lib/updates/status";
import { getTemplateKind } from "@/lib/email-templates/registry";
import type { UpdateWithClient, UpdateStatus } from "@/types";

const FILTERS: { id: "all" | UpdateStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Drafts" },
  { id: "sent", label: "Sent" },
  { id: "failed", label: "Failed" },
];

export function UpdatesReport({ updates }: { updates: UpdateWithClient[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | UpdateStatus>("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<UpdateWithClient | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (u: UpdateWithClient) => {
    if (!confirm(`Delete this ${u.status} update for ${u.client?.name ?? "this client"}? This can't be undone.`)) return;
    setDeleting(u.id);
    try {
      const res = await fetch(`/api/updates/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      toast.success("Update deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: updates.length };
    for (const u of updates) c[u.status] = (c[u.status] ?? 0) + 1;
    return c;
  }, [updates]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return updates.filter((u) => {
      if (filter !== "all" && u.status !== filter) return false;
      if (!q) return true;
      return (
        u.subject.toLowerCase().includes(q) ||
        (u.client?.name ?? "").toLowerCase().includes(q) ||
        (u.client_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [updates, filter, query]);

  const editable = (s: string) => s === "draft" || s === "scheduled" || s === "failed";

  return (
    <div className="space-y-5">
      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className="rounded-full gap-1.5"
            >
              {f.label}
              <span className="text-xs opacity-70">{counts[f.id] ?? 0}</span>
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, subject, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No updates match this view.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((u) => {
            const meta = updateStatusMeta(u.status);
            const isScheduled = u.status === "scheduled";
            const timeLabel = isScheduled
              ? `Sends ${formatUpdateTime(u.scheduled_for)}`
              : u.status === "draft"
                ? `Saved ${formatUpdateTime(u.created_at)}`
                : formatUpdateTime(u.sent_at || u.created_at);
            return (
              <Card key={u.id} className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                      {isScheduled ? <IconClock className="h-4 w-4 text-teal" /> : <IconMail className="h-4 w-4 text-teal" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {u.client ? (
                          <Link
                            href={`/hub/clients/${u.client.client_number}/updates`}
                            className="font-medium text-foreground hover:text-rose truncate"
                          >
                            {u.client.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground">Unknown client</span>
                        )}
                        <Badge variant={meta.variant} className="rounded-full text-xs shrink-0">{meta.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate max-w-[280px]">{u.subject}</span>
                        <span>·</span>
                        <span>{timeLabel}</span>
                        {u.status === "sent" && !u.emailed && (
                          <Badge variant="secondary" className="rounded-full text-xs">Logged only</Badge>
                        )}
                        {u.status === "sent" && u.opened_at && (
                          <span className="flex items-center gap-1 text-teal" title={`Opened ${formatUpdateTime(u.opened_at)}`}>
                            <IconEye className="h-3 w-3" />
                            Opened
                            {u.open_count > 1 && <span className="text-muted-foreground">({u.open_count})</span>}
                          </span>
                        )}
                        {u.status === "failed" && u.send_error && (
                          <span className="text-destructive truncate max-w-[200px]" title={u.send_error}>{u.send_error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8" onClick={() => setPreview(u)}>
                      <IconEye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    {editable(u.status) && u.client && (
                      <Link href={`/hub/clients/${u.client.client_number}/updates/${u.id}/edit`}>
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0" title="Edit">
                          <IconEdit3 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id}
                    >
                      <IconTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {preview?.subject}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={updateStatusMeta(preview.status).variant} className="rounded-full text-xs">
                  {updateStatusMeta(preview.status).label}
                </Badge>
                <span>{preview.client?.name}</span>
                {preview.client_email && <span>· {preview.client_email}</span>}
                <span>· {getTemplateKind(preview.template_kind).label}</span>
              </div>
              <div className="border border-border/60 rounded-xl overflow-hidden bg-[#F5F5F5]">
                <iframe srcDoc={preview.body_html} title="Email preview" className="w-full" style={{ height: "520px", border: "none" }} />
              </div>
              {editable(preview.status) && preview.client && (
                <div className="flex justify-end">
                  <Link href={`/hub/clients/${preview.client.client_number}/updates/${preview.id}/edit`}>
                    <Button size="sm" className="rounded-full gap-1.5">
                      <IconExternalLink className="h-3.5 w-3.5" />
                      Open to edit
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
