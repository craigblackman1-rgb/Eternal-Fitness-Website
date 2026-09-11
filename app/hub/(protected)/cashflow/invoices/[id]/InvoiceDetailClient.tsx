"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HubCard, HubCardHeader, HubPageHeader, StatusBadge } from "@/components/hub";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IconChevronLeft, IconMail, IconTrash2, IconEdit3, IconFileText, IconEye, IconRefreshCw, IconArrowLeft } from "@/components/icons";
import { InvoicePreviewDialog } from "./InvoicePreviewDialog";
import { toast } from "sonner";
import type { DBInvoice, DBInvoiceLineItem } from "@/types";

const fmt = (n: number) => `£${n.toFixed(2)}`;

interface InvoiceDetailClientProps {
  invoice: DBInvoice & { clients?: { name: string; client_number: number } | null; client_documents?: { emailed: boolean } | null };
  lineItems: DBInvoiceLineItem[];
  deliveryHistory?: ReactNode;
}

export function InvoiceDetailClient({ invoice, lineItems, deliveryHistory }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (!statusDialogOpen) setStatusAction(null);
  }, [statusDialogOpen]);

  const isDraft = invoice.status === "draft";
  const client = invoice.clients;

  type StatusOption = { label: string; value: string; action: string };

  const statusOptions: StatusOption[] = (() => {
    switch (invoice.status) {
      case "draft":
        return [{ label: "Mark paid", value: "paid", action: "paid" }];
      case "sent":
        return [
          { label: "Mark paid", value: "paid", action: "paid" },
          { label: "Void", value: "void", action: "void" },
          ...(invoice.client_documents?.emailed ? [] : [{ label: "Back to draft", value: "draft", action: "revert" }]),
        ];
      case "overdue":
        return [
          { label: "Mark paid", value: "paid", action: "paid" },
          { label: "Void", value: "void", action: "void" },
        ];
      case "paid":
        return [{ label: "Back to unpaid (sent)", value: "sent", action: "undo-paid" }];
      case "void":
        return [{ label: "Reinstate as draft", value: "draft", action: "void-reinstate" }];
      default:
        return [];
    }
  })();

  const handleStatusChange = (val: string) => {
    const opt = statusOptions.find((o) => o.value === val);
    if (!opt) return;
    setStatusAction(opt.action);
    setStatusDialogOpen(true);
  };

  const actionLabel = statusOptions.find((o) => o.action === statusAction)?.label ?? "";

  const act = async (label: string, run: () => Promise<Response>, onOk: (data: unknown) => void) => {
    setBusy(label);
    try {
      const res = await run();
      const text = await res.text();
      let data: Record<string, unknown> | null = null;
      try { data = JSON.parse(text); } catch { /* non-JSON response */ }
      if (!res.ok) throw new Error((data?.error as string) || "Request failed");
      onOk(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const sendInvoice = () =>
    act("send", () => fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" }), (data) => {
      const d = data as { dryRun?: boolean } | null;
      if (d?.dryRun) {
        toast("Email backend not configured — invoice marked, nothing was emailed", { description: "Add RESEND_API_KEY or SENDGRID_API_KEY to send real emails." });
      } else {
        toast.success("Invoice sent");
      }
      router.refresh();
    });

  const deleteInvoice = () =>
    act("delete", () => fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" }), () => {
      toast.success("Invoice deleted");
      router.push("/hub/cashflow/invoices");
    });

  const revertToDraft = () =>
    act("revert", () => fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "draft" }) }), () => {
      setStatusDialogOpen(false);
      toast.success("Invoice reverted to draft");
      router.refresh();
    });

  const markPaid = () =>
    act("paid", () => fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) }), () => {
      setStatusDialogOpen(false);
      toast.success("Invoice marked paid");
      router.refresh();
    });

  const voidInvoice = () =>
    act("void", () => fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "void" }) }), () => {
      setStatusDialogOpen(false);
      toast.success("Invoice voided");
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <HubPageHeader
        title={
          <Link href="/hub/cashflow/invoices" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <IconChevronLeft className="w-4 h-4" />
            Invoice {invoice.invoice_number}
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg gap-1.5"
              onClick={() => setPreviewOpen(true)}
              aria-label="Preview invoice"
            >
              <IconEye className="h-4 w-4" />
              Preview
            </Button>
            {statusOptions.length > 0 && (
              <Select onValueChange={handleStatusChange} value={invoice.status}>
                <SelectTrigger className="h-9 w-44 rounded-lg border-[var(--hub-field-border)] bg-[var(--hub-card)] text-xs focus:border-rose focus:ring-rose/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={invoice.status} disabled>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isDraft ? (
              <>
                <Link href={`/hub/cashflow/invoices/${invoice.id}/edit`}>
                  <Button
                    variant="outline"
                    className="rounded-lg gap-1.5"
                    aria-label="Edit invoice"
                  >
                    <IconEdit3 className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="rounded-lg gap-1.5"
                  onClick={sendInvoice}
                  disabled={busy !== null}
                  aria-label="Send invoice"
                >
                  {busy === "send" ? "…" : (
                    <>
                      <IconMail className="h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-lg gap-1.5 bg-rose text-white hover:bg-rose/90"
                  onClick={() => { setStatusAction("paid"); setStatusDialogOpen(true); }}
                  disabled={busy !== null}
                  aria-label="Mark invoice as paid"
                >
                  {busy === "paid" ? "…" : "Mark paid"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-lg gap-1.5"
                      style={{
                        color: "var(--status-danger-solid)",
                        borderColor: "var(--status-danger-solid)",
                      }}
                      disabled={busy !== null}
                      aria-label="Delete invoice"
                    >
                      <IconTrash2 className="h-4 w-4" />
                      {busy === "delete" ? "…" : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete invoice {invoice.invoice_number}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteInvoice}
                        disabled={busy !== null}
                        style={{
                          backgroundColor: "var(--status-danger-solid)",
                          color: "var(--status-danger-solid-fg)",
                        }}
                      >
                        {busy === "delete" ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : null}
            {!isDraft && (invoice.status === "sent" || invoice.status === "overdue") && (
              <>
                <Button
                  className="rounded-lg gap-1.5 bg-rose text-white hover:bg-rose/90"
                  onClick={() => { setStatusAction("paid"); setStatusDialogOpen(true); }}
                  disabled={busy !== null}
                  aria-label="Mark invoice as paid"
                >
                  {busy === "paid" ? "…" : "Mark paid"}
                </Button>
                {invoice.status === "sent" && !invoice.client_documents?.emailed && (
                  <Button
                    variant="outline"
                    className="rounded-lg gap-1.5"
                    onClick={() => { setStatusAction("revert"); setStatusDialogOpen(true); }}
                    disabled={busy !== null}
                    aria-label="Revert to draft"
                  >
                    {busy === "revert" ? "…" : "Revert to draft"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-lg gap-1.5"
                  style={{
                    color: "var(--status-danger-solid)",
                    borderColor: "var(--status-danger-solid)",
                  }}
                  onClick={() => { setStatusAction("void"); setStatusDialogOpen(true); }}
                  disabled={busy !== null}
                  aria-label="Void invoice"
                >
                  {busy === "void" ? "…" : "Void"}
                </Button>
              </>
            )}
            {isDraft && (
              <AlertDialog open={statusDialogOpen && statusAction === "paid"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark this invoice as paid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This records the invoice as paid without emailing it — use it for cash or an invoice you&apos;ve already handed over. It will not be sent to the client.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={markPaid}
                      disabled={busy !== null}
                      className="bg-rose text-white hover:bg-rose/90"
                    >
                      {busy === "paid" ? "Saving…" : "Mark paid"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!isDraft && (invoice.status === "sent" || invoice.status === "overdue") && (
              <AlertDialog open={statusDialogOpen && statusAction === "paid"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark this invoice as paid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Use this when the client has paid outside the bank feed (cash, or a transfer you&apos;ve already seen). Bank reconciliation will not try to match it again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={markPaid}
                      disabled={busy !== null}
                      className="bg-rose text-white hover:bg-rose/90"
                    >
                      {busy === "paid" ? "Saving…" : "Mark paid"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!isDraft && invoice.status === "sent" && !invoice.client_documents?.emailed && (
              <AlertDialog open={statusDialogOpen && statusAction === "revert"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revert to draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will move the invoice back to draft status so you can edit and send it again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={revertToDraft} disabled={busy !== null}>
                      {busy === "revert" ? "Saving…" : "Revert to draft"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!isDraft && (invoice.status === "sent" || invoice.status === "overdue") && (
              <AlertDialog open={statusDialogOpen && statusAction === "void"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      It stays on record but no longer counts as owed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={voidInvoice}
                      disabled={busy !== null}
                      style={{
                        backgroundColor: "var(--status-danger-solid)",
                        color: "var(--status-danger-solid-fg)",
                      }}
                    >
                      {busy === "void" ? "Voiding…" : "Void"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {invoice.status === "paid" && (
              <AlertDialog open={statusDialogOpen && statusAction === "undo-paid"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Move this invoice back to unpaid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This reverses the paid mark — the invoice goes back to sent status. Use this if it was marked paid by mistake.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        act("undo-paid", () => fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "sent" }) }), () => {
                          setStatusDialogOpen(false);
                          toast.success("Invoice moved back to unpaid");
                          router.refresh();
                        })
                      }
                      disabled={busy !== null}
                    >
                      {busy === "undo-paid" ? "Saving…" : "Back to unpaid"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {invoice.status === "void" && (
              <AlertDialog open={statusDialogOpen && statusAction === "void-reinstate"} onOpenChange={setStatusDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reinstate this draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This moves the invoice from void back to draft so you can edit and send it again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        act("void-reinstate", () => fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "draft" }) }), () => {
                          setStatusDialogOpen(false);
                          toast.success("Invoice reinstated as draft");
                          router.refresh();
                        })
                      }
                      disabled={busy !== null}
                    >
                      {busy === "void-reinstate" ? "Saving…" : "Reinstate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />

      {isDraft && (
        <p className="text-sm text-muted-foreground rounded-lg bg-[var(--hub-canvas)] border border-[var(--hub-border)] px-3 py-2">
          This is a draft — nothing has been sent to the client yet.
        </p>
      )}

      <HubCard>
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Details" color="navy" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Status</p>
            <StatusBadge status={invoice.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Client</p>
            {client ? (
              <Link
                href={`/hub/clients/${client.client_number}`}
                className="text-sm font-medium text-foreground hover:text-rose transition-colors"
              >
                {client.name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Issue date</p>
            <p className="text-sm text-foreground">
              {new Date(invoice.issue_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Due date</p>
            <p className="text-sm text-foreground">
              {new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </HubCard>

      <HubCard padded={false}>
        <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Line items" color="teal" className="px-5 pt-5" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hub-border)] text-left">
                <th className="px-5 py-2.5 font-medium text-muted-foreground text-xs">Description</th>
                <th className="px-2 py-2.5 font-medium text-muted-foreground text-xs w-20 text-right">Qty</th>
                <th className="px-2 py-2.5 font-medium text-muted-foreground text-xs w-28 text-right">Unit price</th>
                <th className="px-5 py-2.5 font-medium text-muted-foreground text-xs w-28 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.id} className="border-b border-[var(--hub-border)]">
                  <td className="px-5 py-2.5 text-foreground">{li.description}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{li.quantity}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmt(li.unit_price)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium">{fmt(li.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--hub-hover)]">
                <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-sm">
                  Total
                </td>
                <td className="px-5 py-2.5 text-right font-bold text-base tabular-nums">
                  {fmt(invoice.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </HubCard>

      {invoice.notes && (
        <HubCard>
          <HubCardHeader icon={<IconFileText className="w-4 h-4" />} title="Notes" color="amber" />
          <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.notes}</p>
        </HubCard>
      )}

      {deliveryHistory}

      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={invoice}
      />
    </div>
  );
}
