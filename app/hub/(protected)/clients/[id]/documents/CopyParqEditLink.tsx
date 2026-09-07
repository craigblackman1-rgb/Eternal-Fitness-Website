"use client";

import { useState } from "react";
import { IconCopy } from "@/components/icons";

export function CopyParqEditLink({ clientName }: { clientName: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const res = await fetch(`/api/parq?client_name=${encodeURIComponent(clientName)}`);
      if (!res.ok) return;
      const parqData = await res.json();
      if (!parqData?.id || !parqData?.link_exp || !parqData?.link_sig) return;
      const url = `${window.location.origin}/parq/edit/${parqData.id}?exp=${parqData.link_exp}&sig=${parqData.link_sig}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // silently fail — same as the original agreement detail button
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-rose)] hover:underline"
    >
      <IconCopy className="w-3 h-3" />
      {copied ? "Link copied!" : "Copy PAR-Q edit link"}
    </button>
  );
}
