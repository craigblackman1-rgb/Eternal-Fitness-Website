"use client";

import { useState } from "react";
import Link from "next/link";

const ICO = {
  back: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  pill: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  desktop: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

interface Props {
  clientNumber: number;
  name: string;
  email: string;
  phone: string;
  emergencyContact: { name?: string; relationship?: string; phone?: string } | null;
  conditions: string[];
  medications: { name: string; dose?: string; frequency?: string; notes?: string }[];
  fullProfile: Record<string, unknown>;
}

export function ClientEditScreen({
  clientNumber,
  name,
  email: initEmail,
  phone: initPhone,
  emergencyContact: initEc,
  conditions,
  medications,
  fullProfile,
}: Props) {
  const [phone, setPhone] = useState(initPhone);
  const [email, setEmail] = useState(initEmail);
  const [ecName, setEcName] = useState(initEc?.name ?? "");
  const [ecRelationship, setEcRelationship] = useState(initEc?.relationship ?? "");
  const [ecPhone, setEcPhone] = useState(initEc?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasChanges =
    phone !== initPhone ||
    email !== initEmail ||
    ecName !== (initEc?.name ?? "") ||
    ecRelationship !== (initEc?.relationship ?? "") ||
    ecPhone !== (initEc?.phone ?? "");

  async function handleSave() {
    setSaving(true);
    setToast(null);

    const ec = { name: ecName.trim(), relationship: ecRelationship.trim(), phone: ecPhone.trim() };
    const updatedProfile = {
      ...fullProfile,
      emergency_contact: ec.name || ec.phone ? ec : undefined,
    };

    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim() || null,
          email: email.trim() || null,
          profile: updatedProfile,
        }),
      });

      if (res.ok) {
        setToast("Saved");
        setTimeout(() => setToast(null), 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast(err.error ?? "Could not save");
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast("Network error");
      setTimeout(() => setToast(null), 4000);
    }
    setSaving(false);
  }

  return (
    <>
      <header className="mtop">
        <div className="mtop-row">
          <Link className="mtop-back" href={`/hub/m/clients/${clientNumber}`}>
            {ICO.back}
          </Link>
          <div className="mtop-id">
            <div className="mtop-t">Edit essentials</div>
            <div className="mtop-s">{name}</div>
          </div>
          <Link className="desktop-link" href={`/hub/clients/${clientNumber}/edit`}>
            {ICO.desktop}
            Desktop
          </Link>
        </div>
      </header>

      <main className="mcontent">
        <div className="sec-label">
          <h2>Contact</h2>
        </div>
        <div className="panel">
          <div className="panel-b">
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <div className="edit-field-ic">
                {ICO.phone}
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 900000"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="edit-field-ic">
                {ICO.mail}
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <div className="sec-label" style={{ marginTop: 8 }}>
              <h2>Emergency contact</h2>
            </div>
            <div className="field">
              <label htmlFor="ec-name">Name</label>
              <input
                id="ec-name"
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                placeholder="Contact name"
              />
            </div>
            <div className="field">
              <label htmlFor="ec-rel">Relationship</label>
              <input
                id="ec-rel"
                type="text"
                value={ecRelationship}
                onChange={(e) => setEcRelationship(e.target.value)}
                placeholder="e.g. Partner"
              />
            </div>
            <div className="field">
              <label htmlFor="ec-phone">Phone</label>
              <div className="edit-field-ic">
                {ICO.phone}
                <input
                  id="ec-phone"
                  type="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  placeholder="07700 900000"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sec-label" style={{ marginTop: 20 }}>
          <h2>Health flags</h2>
        </div>
        <div className="panel">
          <div className="panel-b">
            <div className="field">
              <label>Conditions</label>
              {conditions.length === 0 ? (
                <div className="t-empty">No conditions recorded</div>
              ) : (
                <div className="edit-tag-list">
                  {conditions.map((c) => (
                    <span key={c} className="edit-tag">{c}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="field">
              <label>Medications</label>
              {medications.length === 0 ? (
                <div className="t-empty">No medications recorded</div>
              ) : (
                <div className="edit-med-list">
                  {medications.map((m, i) => (
                    <div key={i} className="edit-med-row">
                      <span className="edit-med-name">{m.name}</span>
                      {m.dose && <span className="edit-med-detail">{m.dose}</span>}
                      {m.frequency && <span className="edit-med-detail">{m.frequency}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="edit-health-link">
              {ICO.alert}
              <span>
                Full health records are on the{" "}
                <Link href={`/hub/clients/${clientNumber}/edit#sec-health`}>desktop hub</Link>
              </span>
            </div>
          </div>
        </div>

        <div className="edit-save-bar">
          <button
            className="btn btn-primary"
            disabled={saving || !hasChanges}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </main>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  );
}
