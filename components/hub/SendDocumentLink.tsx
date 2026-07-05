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
}

export function SendDocumentLink({ path, clientNumber, label, existingId }: SendDocumentLinkProps) {
  const copyLink = async () => {
    // Existing PAR-Q → send the prefilled edit link so the client updates their
    // own document. No existing doc → send the blank form for a first submission.
    const url = existingId
      ? `${window.location.origin}${path}/edit/${existingId}`
      : `${window.location.origin}${path}?client=${clientNumber}`;
    await navigator.clipboard.writeText(url);
    toast.success(
      existingId
        ? "Link to the client's existing PAR-Q copied — send it so they can update it"
        : `${label} link copied — send it to the client`,
    );
  };

  return (
    <Button variant="outline" size="sm" onClick={copyLink} className="rounded-full gap-1.5 border-border/60 h-7 px-2.5 text-xs">
      <IconMail className="h-3 w-3" />
      {label}
    </Button>
  );
}
