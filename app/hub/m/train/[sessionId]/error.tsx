"use client";

import { MobileErrorPanel } from "@/components/hub/MobileErrorPanel";

export default function TrainSessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MobileErrorPanel
      error={error}
      reset={reset}
      backHref="/hub/m/train"
      backLabel="Back to Training"
    />
  );
}
