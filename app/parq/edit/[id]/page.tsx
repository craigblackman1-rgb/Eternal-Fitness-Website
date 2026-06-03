import { notFound } from "next/navigation";
import ParqEditClient from "./ParqEditClient";
import { createClient } from "@/lib/supabase-server";

export default async function ParqEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: parq } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!parq) {
    notFound();
  }

  return <ParqEditClient parq={parq} />;
}
