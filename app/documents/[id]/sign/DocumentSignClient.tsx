"use client";

import { useState } from "react";
import { DocumentView } from "@/components/documents/DocumentView";
import type { ClientDocument } from "@/lib/documents/types";

function CheckIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function DocumentSignClient({ doc }: { doc: ClientDocument }) {
  const [name, setName] = useState(doc.client_name ?? "");
  const [signature, setSignature] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agreed, setAgreed] = useState(false);
  const [consentChoices, setConsentChoices] = useState<Record<string, boolean>>(
    doc.consent_choices ?? {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(doc.status === "signed" && !!doc.client_signature);
  const [error, setError] = useState<string | null>(null);

  const alreadySigned = doc.client_signature && doc.client_signed_date;
  const hasConsentGroups = !!doc.body.consentGroups?.length;

  const onConsentChange = (key: string, value: boolean) => {
    setConsentChoices((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Please enter your full name.");
    if (!signature.trim()) return setError("Please type your name as your signature.");
    if (!agreed) return setError("Please confirm you have read and agree to this document.");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        role: "client",
        name: name.trim(),
        signature: signature.trim(),
        date,
      };
      if (hasConsentGroups) body.consent_choices = consentChoices;
      const res = await fetch(`/api/documents/${doc.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="doc-signed-page">
        <div className="doc-signed-card">
          <div className="doc-signed-check">
            <CheckIcon />
          </div>
          <h2 className="doc-signed-title">Signed — thank you</h2>
          <p className="doc-signed-copy">
            Your signature has been recorded. Esther has a copy on file.
          </p>
        </div>
      </div>
    );
  }

  const signSlot = (
    <div>
      <h2 className="doc-section__title">Sign</h2>

      {alreadySigned ? (
        <div className="doc-note doc-note--plain">
          <p>
            This document was signed by {doc.client_name} on {doc.client_signed_date}.
          </p>
        </div>
      ) : (
        <>
          <p className="doc-section__intro">
            Please check your details below, then confirm you have read and agree to this document.
          </p>

          <div className="sign-grid">
            <div className="field">
              <label className="field__label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field field--full">
              <label className="field__label" htmlFor="sig">
                Type your full name as your signature
              </label>
              <input
                id="sig"
                className="input"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
              />
            </div>
          </div>

          <label className="doc-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="doc-agree__box"
            />
            <span>I confirm I have read and agree to this document.</span>
          </label>

          {error && (
            <div className="doc-error-summary" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="actions no-print">
            <button
              type="button"
              className="btn btn--primary"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Signing…" : "Sign & submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <DocumentView
      doc={doc}
      signSlot={signSlot}
      consentChoices={consentChoices}
      onConsentChange={onConsentChange}
    />
  );
}
