"use client";

import { Button } from "@/components/ui/button";
import { IconMail } from "@/components/icons";
import { toast } from "sonner";

interface SendDocumentLinkProps {
  path: "/parq" | "/agreement";
  clientNumber: number;
  label: string;
  /** When set, link the client to their existing document to update it, not a blank form. */
  existingId?: string;
  /** Signed 7-day link params (minted server-side) for the existing-document link. */
  exp?: number;
  sig?: string;
}

export function SendDocumentLink({ path, clientNumber, label, existingId, exp, sig }: SendDocumentLinkProps) {
  const copyLink = async () => {
    // Existing PAR-Q → send the signed, 7-day edit link so the client updates
    // their own document. No existing doc → send the blank form for a first submission.
    const url =
      existingId && exp && sig
        ? `${window.location.origin}${path}/edit/${existingId}?exp=${exp}&sig=${sig}`
        : `${window.location.origin}${path}?client=${clientNumber}`;
    await navigator.clipboard.writeText(url);
    toast.success(
      existingId && exp && sig
        ? "Fresh 7-day link to the client's PAR-Q copied — send it so they can update it"
        : `${label} link copied — send it to the client`,
    );
  };

  return (
    <Button variant="outline" size="sm" onClick={copyLink} className="rounded-lg gap-1.5 border-border/60 h-7 px-2.5 text-xs">
      <IconMail className="h-3 w-3" />
      {label}
    </Button>
  );
}
