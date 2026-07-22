"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconMail } from "@/components/icons";

export function InviteToPortalButton({
  clientNumber,
  hasEmail,
}: {
  clientNumber: number;
  hasEmail: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientNumber}/portal-invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send invite.");
        return;
      }
      const msg = data.devPasswordNote
        ? `Invite sent to ${data.email}. ${data.devPasswordNote}`
        : `Invite sent to ${data.email}.`;
      toast.success(msg);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInvite}
      disabled={loading || !hasEmail}
      title={hasEmail ? undefined : "No email address on file for this client"}
      className="gap-1.5"
    >
      <IconMail className="h-4 w-4" />
      {loading ? "Sending..." : "Invite to portal"}
    </Button>
  );
}
