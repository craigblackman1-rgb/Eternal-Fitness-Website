import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { EquipmentManager } from "./EquipmentManager";
import type { StudioEquipment } from "@/types";

export default async function StudioEquipmentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hub/login");

  const { data: equipment } = await supabase
    .from("studio_equipment")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Studio Equipment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The equipment available in the studio — the Plan Agent only programmes from this list.
          Add or remove items here; no deploy needed.
        </p>
      </div>
      <EquipmentManager initialEquipment={(equipment ?? []) as StudioEquipment[]} />
    </div>
  );
}
