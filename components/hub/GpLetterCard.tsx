"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GpLetterStatus } from "@/types";

interface GpLetterCardProps {
  clientId: string;
  gpLetterStatus: GpLetterStatus;
  requestedDate: string | null;
  receivedDate: string | null;
}

export function GpLetterCard({ clientId, gpLetterStatus, requestedDate, receivedDate }: GpLetterCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GpLetterStatus>(gpLetterStatus);
  const [requested, setRequested] = useState(requestedDate ?? "");
  const [received, setReceived] = useState(receivedDate ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (updates: Partial<{ gp_letter_status: GpLetterStatus; gp_letter_requested_date: string | null; gp_letter_received_date: string | null }>) => {
    setSaving(true);
    const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to save" }));
      toast.error(`Failed to save: ${err.error}`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">GP Letter</Label>
        <Select
          value={status}
          onValueChange={(v: GpLetterStatus) => {
            setStatus(v);
            save({ gp_letter_status: v });
          }}
          disabled={saving}
        >
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="not_required">Not Required</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status !== "not_required" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Requested</Label>
          <Input
            type="date"
            className="h-9"
            value={requested}
            disabled={saving}
            onChange={(e) => {
              setRequested(e.target.value);
              save({ gp_letter_requested_date: e.target.value || null });
            }}
          />
        </div>
      )}
      {status === "received" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Received</Label>
          <Input
            type="date"
            className="h-9"
            value={received}
            disabled={saving}
            onChange={(e) => {
              setReceived(e.target.value);
              save({ gp_letter_received_date: e.target.value || null });
            }}
          />
        </div>
      )}
    </div>
  );
}
