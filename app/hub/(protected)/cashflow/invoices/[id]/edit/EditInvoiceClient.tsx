"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { HubPageHeader, HubCard, HubCardHeader, EmptyState } from "@/components/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconChevronLeft, IconPlus, IconTrash2, IconFileText, IconSave } from "@/components/icons";
import type { DBInvoice, DBInvoiceLineItem } from "@/types";

interface LineItem {
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
}

let _id = 0;
function nextKey() {
  return `li-${++_id}`;
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

interface EditInvoiceClientProps {
  invoice: DBInvoice & { clients?: { name: string; client_number: number } | null };
  lineItems: DBInvoiceLineItem[];
}

export function EditInvoiceClient({ invoice, lineItems }: EditInvoiceClientProps) {
  const router = useRouter();

  const [issueDate, setIssueDate] = useState(invoice.issue_date);
  const [dueDate, setDueDate] = useState(invoice.due_date);
  const [notes, setNotes] = useState(invoice.notes ?? "");
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<LineItem[]>(() =>
    lineItems.map((li) => ({
      key: nextKey(),
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
    })),
  );

  const subtotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
  const total = subtotal;

  const addLine = () => {
    setItems([...items, { key: nextKey(), description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (key: string) => {
    setItems(items.filter((li) => li.key !== key));
  };

  const updateLine = (key: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((li) => (li.key === key ? { ...li, [field]: value } : li)));
  };

  const save = async () => {
    if (!dueDate) return toast.error("Enter a due date");
    if (items.length === 0 || items.every((li) => !li.description.trim())) {
      return toast.error("Add at least one line item with a description");
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_date: issueDate,
          due_date: dueDate,
          notes,
          line_items: items.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unit_price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Invoice updated");
      router.push(`/hub/cashflow/invoices/${invoice.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <HubPageHeader
        title={
          <Link
            href={`/hub/cashflow/invoices/${invoice.id}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconChevronLeft className="w-4 h-4" />
            Edit invoice {invoice.invoice_number}
          </Link>
        }
      />

      {/* Client (read-only) */}
      <HubCard>
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Client" color="navy" />
        {invoice.clients ? (
          <div className="p-3 bg-[var(--hub-hover)] rounded-lg">
            <p className="font-medium text-sm">{invoice.clients.name}</p>
            <p className="text-xs text-muted-foreground">Client #{invoice.clients.client_number}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No client</p>
        )}
      </HubCard>

      {/* Line items */}
      <HubCard padded={false}>
        <HubCardHeader
          icon={<IconFileText className="w-4 h-4" />}
          title="Line items"
          color="teal"
          className="px-5 pt-5"
          action={
            <button onClick={addLine} className="text-xs text-rose hover:text-rose/80 font-medium flex items-center gap-1">
              <IconPlus className="w-3.5 h-3.5" />
              Add line
            </button>
          }
        />
        {items.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={<IconFileText className="w-8 h-8" />}
              title="No line items"
              description="Add a line item to get started"
              cta={{ label: "Add line item", onClick: addLine }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--hub-border)] text-left">
                  <th className="px-5 py-2.5 font-medium text-muted-foreground text-xs">Description</th>
                  <th className="px-2 py-2.5 font-medium text-muted-foreground text-xs w-20 text-right">Qty</th>
                  <th className="px-2 py-2.5 font-medium text-muted-foreground text-xs w-28 text-right">Unit price</th>
                  <th className="px-5 py-2.5 font-medium text-muted-foreground text-xs w-28 text-right">Total</th>
                  <th className="px-5 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((li) => (
                  <tr key={li.key} className="border-b border-[var(--hub-border)] hover:bg-[var(--hub-hover)] transition-colors">
                    <td className="px-5 py-2">
                      <Input
                        className="w-full border-0 bg-transparent focus:bg-white focus:border-[var(--hub-field-border)] px-0 h-8 text-sm"
                        placeholder="Description"
                        value={li.description}
                        onChange={(e) => updateLine(li.key, "description", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full text-right border-0 bg-transparent focus:bg-white focus:border-[var(--hub-field-border)] h-8 text-sm tabular-nums"
                        value={li.quantity}
                        onChange={(e) => updateLine(li.key, "quantity", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full text-right border-0 bg-transparent focus:bg-white focus:border-[var(--hub-field-border)] h-8 text-sm tabular-nums"
                        value={li.unit_price}
                        onChange={(e) => updateLine(li.key, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium">
                      {fmt(li.quantity * li.unit_price)}
                    </td>
                    <td className="px-5 py-2">
                      <button
                        onClick={() => removeLine(li.key)}
                        className="text-muted-foreground hover:text-danger p-1"
                        title="Remove line"
                      >
                        <IconTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--hub-hover)]">
                  <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-sm">
                    Total
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-base tabular-nums">
                    {fmt(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </HubCard>

      {/* Details */}
      <HubCard>
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Details" color="amber" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Issue date</label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Due date <span className="text-rose">*</span>
            </label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
          <Input
            placeholder="Optional — payment instructions, reference, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </HubCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href={`/hub/cashflow/invoices/${invoice.id}`}>
          <Button variant="outline" className="rounded-lg">Cancel</Button>
        </Link>
        <Button
          className="rounded-lg gap-1.5 bg-rose hover:bg-rose/90 text-white"
          onClick={save}
          disabled={saving}
        >
          <IconSave className="w-4 h-4" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
