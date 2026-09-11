import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(name, client_number, display_code, email)")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: lines } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", params.id)
    .order("sort_order");

  return NextResponse.json({ ...data, line_items: lines ?? [] });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", params.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const body = await request.json();

  // Mobile mark-paid: accepts { status: "paid" } for sent/overdue invoices.
  // Mirrors what reconciliation/confirm does (status + updated_at) without
  // requiring a transaction_id — the mobile flow has no bank-match link.
  if (body.status === "paid") {
    if (existing.status !== "sent" && existing.status !== "overdue") {
      return NextResponse.json({ error: "Only sent or overdue invoices can be marked paid" }, { status: 400 });
    }
    await supabase
      .from("invoices")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", params.id);
    return NextResponse.json({ success: true });
  }

  // Revert to draft: only allowed for sent invoices where the linked document
  // was never actually emailed (or there is no linked document at all).
  if (body.status === "draft") {
    if (existing.status !== "sent") {
      return NextResponse.json({ error: "Only sent invoices can be reverted to draft" }, { status: 400 });
    }
    const { data: fullInvoice } = await supabase
      .from("invoices")
      .select("client_document_id")
      .eq("id", params.id)
      .single();
    if (fullInvoice?.client_document_id) {
      const { data: doc } = await supabase
        .from("client_documents")
        .select("emailed")
        .eq("id", fullInvoice.client_document_id)
        .single();
      if (doc?.emailed) {
        return NextResponse.json({ error: "This invoice was emailed to the client — void it and raise a new one instead." }, { status: 400 });
      }
      // Reset the linked document back to draft too
      await supabase
        .from("client_documents")
        .update({ status: "draft", sent_at: null })
        .eq("id", fullInvoice.client_document_id);
    }
    await supabase
      .from("invoices")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", params.id);
    return NextResponse.json({ success: true });
  }

  // Void: allowed for sent or overdue invoices (any emailed state).
  if (body.status === "void") {
    if (existing.status !== "sent" && existing.status !== "overdue") {
      return NextResponse.json({ error: "Only sent or overdue invoices can be voided" }, { status: 400 });
    }
    await supabase
      .from("invoices")
      .update({ status: "void", updated_at: new Date().toISOString() })
      .eq("id", params.id);
    return NextResponse.json({ success: true });
  }

  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft invoices can be edited" }, { status: 400 });
  }

  const { issue_date, due_date, notes, line_items } = body;

  const lines: { description: string; quantity: number; unit_price: number }[] =
    Array.isArray(line_items) ? line_items : [];

  const subtotal = lines.reduce((sum, li) => sum + (li.quantity || 0) * (li.unit_price || 0), 0);
  const total = subtotal;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (issue_date !== undefined) update.issue_date = issue_date;
  if (due_date !== undefined) update.due_date = due_date;
  if (notes !== undefined) update.notes = notes || null;
  update.subtotal = subtotal;
  update.vat_total = 0;
  update.total = total;

  await supabase.from("invoices").update(update).eq("id", params.id);

  if (line_items !== undefined) {
    await supabase.from("invoice_line_items").delete().eq("invoice_id", params.id);

    if (lines.length > 0) {
      const lineRows = lines.map((li, i) => ({
        invoice_id: params.id,
        description: li.description,
        quantity: li.quantity || 1,
        unit_price: li.unit_price || 0,
        vat_rate: 0,
        line_total: (li.quantity || 0) * (li.unit_price || 0),
        sort_order: i,
      }));
      await supabase.from("invoice_line_items").insert(lineRows);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 });
  }

  const { error } = await supabase.from("invoices").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
