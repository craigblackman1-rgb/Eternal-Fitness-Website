"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentBodyView } from "@/lib/documents/render";
import type { ClientDocument } from "@/lib/documents/types";

const NAVY = "#282B38";
const ROSE = "#C1839F";
const TEAL = "#087E8B";

function BrandHeader({ title }: { title: string }) {
  return (
    <div style={{ backgroundColor: NAVY }} className="px-6 py-6 rounded-t-2xl">
      <div className="flex items-center gap-3">
        <div style={{ backgroundColor: ROSE }} className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold tracking-wide">EF</div>
        <div>
          <div className="text-white font-bold tracking-[0.2em] uppercase text-lg leading-none">Eternal</div>
          <div style={{ color: ROSE }} className="text-[11px] font-medium tracking-[0.3em] uppercase mt-1 leading-none">Fitness</div>
        </div>
      </div>
      <h1 className="text-white text-xl font-bold mt-5">{title}</h1>
      <p className="text-white/60 text-xs mt-1">Please read this document and sign at the bottom to confirm.</p>
    </div>
  );
}

export function DocumentSignClient({ doc }: { doc: ClientDocument }) {
  const [name, setName] = useState(doc.client_name ?? "");
  const [signature, setSignature] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(doc.status === "signed" && !!doc.client_signature);
  const [error, setError] = useState<string | null>(null);

  const alreadySigned = doc.client_signature && doc.client_signed_date;

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Please enter your full name.");
    if (!signature.trim()) return setError("Please type your name as your signature.");
    if (!agreed) return setError("Please confirm you have read and agree to this document.");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "client", name: name.trim(), signature: signature.trim(), date }),
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
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E1E1E] mb-2">Signed — thank you</h2>
          <p className="text-[#525A61] text-sm">Your signature has been recorded. Esther has a copy on file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        <BrandHeader title={doc.title} />
        <div className="px-6 py-6">
          <DocumentBodyView body={doc.body} />

          {alreadySigned ? (
            <div className="mt-8 rounded-xl bg-[#F5F5F5] p-4 text-sm text-[#525A61]">
              This document was signed by {doc.client_name} on {doc.client_signed_date}.
            </div>
          ) : (
            <div className="mt-8 border-t border-[#E5E5E5] pt-6">
              <h3 className="text-base font-bold text-[#1E1E1E] mb-4">Sign this document</h3>
              {error && <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="sig">Type your full name as your signature</Label>
                  <Input id="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your full name" />
                </div>
              </div>
              <label className="flex items-start gap-2 mt-4 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded accent-[#C1839F]" />
                <span className="text-sm text-[#525A61]">I confirm I have read and agree to this document.</span>
              </label>
              <div className="mt-6 flex justify-end">
                <Button onClick={submit} disabled={submitting} style={{ backgroundColor: TEAL }} className="text-white hover:opacity-90 px-8 rounded-full">
                  {submitting ? "Signing…" : "Sign & submit"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
