"use client";

import { Button } from "@/components/ui/button";
import { IconPrinter } from "@/components/icons";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <IconPrinter className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
