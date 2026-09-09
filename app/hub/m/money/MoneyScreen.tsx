"use client";

import { useMemo, useState } from "react";
import type { InvoiceListItem } from "./page";

const ICO = {
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  send: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4z" />
    </svg>
  ),
  mail: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  pound: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  empty: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
};

type Segment = "outstanding" | "paid" | "drafts";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "outstanding", label: "Outstanding" },
  { key: "paid", label: "Paid" },
  { key: "drafts", label: "Drafts" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtMoney(n: number): string {
  return `£${n.toFixed(2)}`;
}

function statusPill(status: string): { label: string; cls: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (status === "paid") return { label: "Paid", cls: "ok" };
  if (status === "draft") return { label: "Draft", cls: "soon" };
  if (status === "void") return { label: "Void", cls: "soon" };
  if (status === "overdue") return { label: "Overdue", cls: "overdue" };
  return { label: "Sent", cls: "today" };
}

interface Props {
  invoices: InvoiceListItem[];
  collected: number;
  outstanding: number;
}

export function MoneyScreen({ invoices, collected, outstanding }: Props) {
  const [seg, setSeg] = useState<Segment>("outstanding");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailInv, setDetailInv] = useState<InvoiceListItem | null>(null);
  const [lines, setLines] = useState<{ description: string; quantity: number; unit_price: number; line_total: number }[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (seg === "outstanding") return invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue");
    if (seg === "paid") return invoices.filter((inv) => inv.status === "paid");
    return invoices.filter((inv) => inv.status === "draft");
  }, [invoices, seg]);

  const counts = useMemo(() => ({
    outstanding: invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
    drafts: invoices.filter((inv) => inv.status === "draft").length,
  }), [invoices]);

  async function openDetail(inv: InvoiceListItem) {
    setDetailInv(inv);
    setOpenId(inv.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      if (res.ok) {
        const data = await res.json();
        setLines(data.line_items ?? []);
      }
    } catch { /* ignore */ }
    setLoadingDetail(false);
  }

  function closeDetail() {
    setOpenId(null);
    setDetailInv(null);
    setLines([]);
  }

  async function markPaid() {
    if (!detailInv) return;
    setActionBusy("paid");
    try {
      const res = await fetch(`/api/cashflow/reconciliation/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: detailInv.id }),
      });
      if (res.ok) {
        showToast("Marked as paid");
        closeDetail();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Could not mark as paid");
      }
    } catch {
      showToast("Network error");
    }
    setActionBusy(null);
  }

  async function resend() {
    if (!detailInv) return;
    setActionBusy("resend");
    try {
      const res = await fetch(`/api/invoices/${detailInv.id}/send`, { method: "POST" });
      if (res.ok) {
        showToast("Invoice sent");
        closeDetail();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Could not send");
      }
    } catch {
      showToast("Network error");
    }
    setActionBusy(null);
  }

  function chase() {
    showToast("Chase email is desktop-only for now");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <div className="mtop-id">
            <div className="mtop-t">Money</div>
            <div className="mtop-s">Invoices &amp; payments</div>
          </div>
        </div>
      </header>

      <main className="mcontent">
        <div className="mcard money-summary">
          <div className="ms-row">
            <div className="ms-item">
              <span className="ms-label">Collected this month</span>
              <span className="ms-fig">{fmtMoney(collected)}</span>
            </div>
            <div className="ms-item">
              <span className="ms-label">Outstanding</span>
              <span className="ms-fig ms-fig-warn">{fmtMoney(outstanding)}</span>
            </div>
          </div>
        </div>

        <div className="seg" style={{ marginBottom: 14 }}>
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              className={`seg-btn${seg === s.key ? " on" : ""}`}
              onClick={() => setSeg(s.key)}
              aria-pressed={seg === s.key}
            >
              {s.label}
              <span className="seg-count">{counts[s.key]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-ic">{ICO.empty}</div>
            <p className="empty-t">
              {seg === "outstanding" ? "All clear" : seg === "paid" ? "No paid invoices" : "No drafts"}
            </p>
            <p className="empty-d">
              {seg === "outstanding"
                ? "No outstanding invoices right now."
                : seg === "paid"
                ? "Paid invoices will appear here."
                : "Draft invoices will appear here."}
            </p>
          </div>
        ) : (
          <div className="inv-list">
            {filtered.map((inv) => {
              const pill = statusPill(inv.status);
              return (
                <button
                  key={inv.id}
                  className="inv-row"
                  onClick={() => openDetail(inv)}
                >
                  <div className="inv-body">
                    <div className="inv-top">
                      <span className="inv-client">{inv.client_name}</span>
                      <span className={`inv-pill ${pill.cls}`}>{pill.label}</span>
                    </div>
                    <div className="inv-sub">
                      {inv.invoice_number} · {fmtMoney(inv.total)}
                    </div>
                    <div className="inv-dates">
                      Sent {fmtDate(inv.issue_date)} · Due {fmtDate(inv.due_date)}
                    </div>
                  </div>
                  <span className="inv-chev">{ICO.chev}</span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {openId && detailInv && (
        <div className="scrim" onClick={closeDetail} />
      )}
      {detailInv && (
        <div className="sheet inv-sheet">
          <div className="grab"><i /></div>
          <div className="sh-head">
            <div className="sh-title">
              <h1>{detailInv.invoice_number}</h1>
              <p>{detailInv.client_name} · {fmtMoney(detailInv.total)}</p>
            </div>
            <button className="sh-close" onClick={closeDetail} aria-label="Close">
              {ICO.close}
            </button>
          </div>
          <div className="sh-body">
            <div className="inv-detail-status">
              <span className={`inv-pill ${statusPill(detailInv.status).cls}`}>
                {statusPill(detailInv.status).label}
              </span>
              <span className="inv-detail-dates">
                Sent {fmtDate(detailInv.issue_date)} · Due {fmtDate(detailInv.due_date)}
              </span>
            </div>

            <div className="sec-label" style={{ marginTop: 4 }}>
              <h2>Line items</h2>
            </div>
            {loadingDetail ? (
              <div className="t-empty">Loading…</div>
            ) : lines.length === 0 ? (
              <div className="t-empty">No line items</div>
            ) : (
              <div className="inv-lines">
                {lines.map((li, i) => (
                  <div key={i} className="inv-line">
                    <div className="inv-line-desc">{li.description}</div>
                    <div className="inv-line-nums">
                      <span>{li.quantity} × {fmtMoney(li.unit_price)}</span>
                      <span className="inv-line-total">{fmtMoney(li.line_total)}</span>
                    </div>
                  </div>
                ))}
                <div className="inv-line inv-total">
                  <div className="inv-line-desc">Total</div>
                  <div className="inv-line-nums">
                    <span className="inv-line-total">{fmtMoney(detailInv.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="inv-actions">
              {detailInv.status === "draft" && (
                <button
                  className="btn btn-primary inv-act-btn"
                  disabled={actionBusy === "resend"}
                  onClick={resend}
                >
                  {ICO.send}
                  {actionBusy === "resend" ? "Sending…" : "Send invoice"}
                </button>
              )}
              {(detailInv.status === "sent" || detailInv.status === "overdue") && (
                <>
                  <button
                    className="btn btn-primary inv-act-btn"
                    disabled={actionBusy === "paid"}
                    onClick={markPaid}
                  >
                    {ICO.check}
                    {actionBusy === "paid" ? "Saving…" : "Mark paid"}
                  </button>
                  <button
                    className="btn btn-outline inv-act-btn"
                    disabled={actionBusy === "resend"}
                    onClick={resend}
                  >
                    {ICO.mail}
                    {actionBusy === "resend" ? "Sending…" : "Resend"}
                  </button>
                  <button
                    className="btn btn-outline inv-act-btn"
                    onClick={chase}
                  >
                    {ICO.send}
                    Chase
                  </button>
                </>
              )}
              {detailInv.status === "paid" && (
                <div className="inv-paid-note">This invoice is paid.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  );
}
