"use client";

import { useState } from "react";
import Link from "next/link";

interface SentUpdate {
  id: string;
  subject: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
  emailed: boolean | null;
  opened_at: string | null;
  open_count: number | null;
  click_count: number | null;
}

interface CommsClientProps {
  firstName: string;
  clientNumber: number;
  sentUpdates: SentUpdate[];
  pronounPossessive: string;
}

function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

const INITIAL_LIMIT = 10;

export function CommsClient({ firstName, clientNumber, sentUpdates, pronounPossessive }: CommsClientProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sentUpdates : sentUpdates.slice(0, INITIAL_LIMIT);
  const hiddenCount = sentUpdates.length - INITIAL_LIMIT;

  return (
    <>
      {/* Write to {firstName} */}
      <Link
        className="mbtn"
        href={`/hub/clients/${clientNumber}/comms/new`}
        style={{ textDecoration: "none" }}
      >
        Write to {firstName}
      </Link>

      {/* Note */}
      <p className="mnote">
        {pronounPossessive} guided composer: quick write or paste, from a template, or review first — three options, then full-screen compose.
      </p>

      {/* Every update sent */}
      <div className="mcard" style={{ marginTop: 14 }}>
        <div className="mcard-h">Every update sent</div>
        {visible.length > 0 ? (
          visible.map((u) => {
            const emailed = u.emailed === true;
            const pillClass = emailed ? "p-ok" : "p-mut";
            const pillLabel = emailed ? "Emailed" : "Logged only";
            const hasOpenInfo = u.opened_at && u.open_count && u.open_count > 0;

            return (
              <div key={u.id} className="mrow">
                <div className="mrow-body">
                  <div className="mrow-t">{u.subject || "Update"}</div>
                  <div className="mrow-s">
                    Sent {fmtShortDate(u.sent_at || u.created_at)}
                    {hasOpenInfo
                      ? ` · Opened ${fmtDateTime(u.opened_at)}${(u.open_count ?? 0) > 1 ? ` ×${u.open_count}` : ""}`
                      : ""}
                  </div>
                </div>
                <span className={`pill ${pillClass}`}>{pillLabel}</span>
              </div>
            );
          })
        ) : (
          <div className="mrow" style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Nothing sent from the hub yet.</span>
          </div>
        )}
        {!expanded && hiddenCount > 0 && (
          <button className="qmore" type="button" onClick={() => setExpanded(true)}>
            Show all {sentUpdates.length} updates ›
          </button>
        )}
      </div>
    </>
  );
}
