"use client";

import { Button } from "@/components/ui/button";
import { IconMail } from "@/components/icons";
import { toast } from "sonner";

interface SendDocumentLinkProps {
  path: "/parq" | "/agreement";
  clientNumber: number;
  label: string;
}

export function SendDocumentLink({ path, clientNumber, label }: SendDocumentLinkProps) {
  const copyLink = async () => {
    const url = `${window.location.origin}${path}?client=${clientNumber}`;
    await navigator.clipboard.writeText(url);
    toast.success(`${label} link copied — send it to the client`);
  };

  return (
    <Button variant="outline" size="sm" onClick={copyLink} className="rounded-full gap-1.5 border-border/60 h-7 px-2.5 text-xs">
      <IconMail className="h-3 w-3" />
      {label}
    </Button>
  );
}
