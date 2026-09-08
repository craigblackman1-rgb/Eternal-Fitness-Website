"use client";

import { DrawerShell } from "./DrawerManager";
import { SupplementaryWorkoutsCard } from "@/components/hub/SupplementaryWorkoutsCard";

/* ── SupplementaryDrawer — 420px (sm) drawer for supplementary work.
   Per the training-drawer-split design: supplementary is the one training
   object that is neither queued nor dated — it is a repeated attachment
   that never uses a session. It gets its own drawer rather than living
   inside the workout-queue drawer, because filing it there would imply it
   consumes a session from the pot. ────── */

interface SupplementaryDrawerProps {
  clientNumber: number;
  clientName: string;
  sessionsRemaining: number | null;
}

export function SupplementaryDrawer({
  clientNumber,
  clientName,
  sessionsRemaining,
}: SupplementaryDrawerProps) {
  return (
    <DrawerShell
      id="dw-supplementary"
      title="Supplementary"
      subtitle={`${clientName} \u00b7 runs alongside \u00b7 uses no sessions`}
      width="sm"
    >
      <p className="text-[12.5px] text-[var(--color-muted)] mb-3.5">
        Supplementary work is attached to a session but is never one of them. Nothing here touches {clientName}&apos;s remaining sessions.
      </p>
      <SupplementaryWorkoutsCard
        clientNumber={clientNumber}
        clientName={clientName}
        sessionsRemaining={sessionsRemaining}
      />
    </DrawerShell>
  );
}
