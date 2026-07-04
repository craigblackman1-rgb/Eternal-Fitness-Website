"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

export function ClientDetailTabs({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(
    searchParams.get("tab") === "plan-agent" ? "plan-agent" : "overview",
  );

  useEffect(() => {
    if (searchParams.get("tab") === "plan-agent") setValue("plan-agent");
  }, [searchParams]);

  return (
    <Tabs value={value} onValueChange={setValue} className="w-full">
      {children}
    </Tabs>
  );
}
