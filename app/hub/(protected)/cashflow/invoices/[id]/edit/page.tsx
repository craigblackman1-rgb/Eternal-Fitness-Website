import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import { EditInvoiceClient } from "./EditInvoiceClient";
import type { DBInvoice, DBInvoiceLineItem } from "@/types";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name, client_number)")
    .eq("id", params.id)
    .single();

  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/hub/cashflow/invoices/${params.id}`);

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", params.id)
    .order("sort_order");

  return (
    <EditInvoiceClient
      invoice={invoice as DBInvoice & { clients?: { name: string; client_number: number } | null }}
      lineItems={(lineItems ?? []) as DBInvoiceLineItem[]}
    />
  );
}
