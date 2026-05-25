"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Calendar, Mail, Phone, MapPin, FileText, CheckCircle, AlertCircle,
  Printer, Send, Edit3, Save, X, Copy, Download,
} from "lucide-react";

interface AgreementData {
  id: string;
  client_name: string;
  client_dob: string | null;
  client_address: string | null;
  client_email: string | null;
  client_phone: string | null;
  trainer_name: string;
  business_name: string;
  start_date: string | null;
  client_name_print: string | null;
  client_signature_date: string | null;
  client_signature_data: string | null;
  client_typed_signature: string | null;
  trainer_name_print: string | null;
  trainer_signature_date: string | null;
  trainer_signature_data: string | null;
  trainer_typed_signature: string | null;
  parq_completed: string;
  parq_date: string | null;
  parq_filed_by: string | null;
  medical_clearance: string;
  medical_clearance_date: string | null;
  medical_clearance_from: string | null;
  agreed_to_terms: boolean;
  signed_at: string;
  created_at: string;
  trainer_notes: string | null;
  package_type: string | null;
  sessions_purchased: number | null;
  session_duration: number | null;
  payment_method: string | null;
  payment_status: string | null;
  sessions_used: number | null;
  sessions_remaining: number | null;
  block_expiry_date: string | null;
  medical_clearance_status: string | null;
  gp_letter_requested_date: string | null;
  gp_letter_received_date: string | null;
  annual_review_due_date: string | null;
  trainer_observations: string | null;
  risk_level: string | null;
  exercise_modifications: string | null;
  watch_for: string | null;
  referral_source: string | null;
  client_status: string | null;
}

export default function AgreementDetailClient({ agreement }: { agreement: AgreementData }) {
  const [data, setData] = useState<AgreementData>(agreement);
  const [editingTrainer, setEditingTrainer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [printView, setPrintView] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [trainerForm, setTrainerForm] = useState({
    trainerNotes: data.trainer_notes || "",
    packageType: data.package_type || "",
    sessionsPurchased: data.sessions_purchased || "",
    sessionDuration: data.session_duration || 60,
    paymentMethod: data.payment_method || "",
    paymentStatus: data.payment_status || "pending",
    sessionsUsed: data.sessions_used || 0,
    sessionsRemaining: data.sessions_remaining ?? (data.sessions_purchased || 0),
    blockExpiryDate: data.block_expiry_date || "",
    medicalClearanceStatus: data.medical_clearance_status || "not_required",
    gpLetterRequestedDate: data.gp_letter_requested_date || "",
    gpLetterReceivedDate: data.gp_letter_received_date || "",
    annualReviewDueDate: data.annual_review_due_date || "",
    trainerObservations: data.trainer_observations || "",
    riskLevel: data.risk_level || "low",
    exerciseModifications: data.exercise_modifications || "",
    watchFor: data.watch_for || "",
    referralSource: data.referral_source || "",
    clientStatus: data.client_status || "active",
  });

  const formatDate = (date: string | null) => {
    if (!date) return "Not provided";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatDateShort = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleTrainerChange = (field: string, value: string | number) => {
    setTrainerForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "sessionsUsed" && typeof value === "number") {
        const purchased = parseInt(String(next.sessionsPurchased)) || 0;
        next.sessionsRemaining = Math.max(0, purchased - value);
      }
      if (field === "sessionsPurchased" && typeof value === "number") {
        next.sessionsRemaining = Math.max(0, value - next.sessionsUsed);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/agreements/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainerForm),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save");
      }

      const updated = await response.json();
      setData((prev) => ({ ...prev, ...updated }));
      setEditingTrainer(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    setPrintView(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintView(false), 500);
    }, 100);
  };

  const handleEmail = () => {
    if (!data.client_email) return;
    const subject = encodeURIComponent(`Your Signed Personal Training Agreement — Eternal Fitness`);
    const body = encodeURIComponent(
      `Dear ${data.client_name},\n\n` +
      `Thank you for signing your personal training agreement with Eternal Fitness.\n\n` +
      `A copy of your signed agreement is held securely on file. You can request access to your data at any time.\n\n` +
      `If you have any questions, please don't hesitate to get in touch.\n\n` +
      `Kind regards,\n` +
      `Esther Fair\n` +
      `Eternal Fitness`
    );
    window.location.href = `mailto:${data.client_email}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = () => {
    if (!data.client_email) return;
    navigator.clipboard.writeText(data.client_email);
  };

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
    </div>
  );

  if (printView) {
    return (
      <div ref={printRef} className="max-w-4xl mx-auto bg-white p-8 print:p-0">
        <header className="border-b-4 border-[#087E8B] pb-4 mb-6">
          <h1 className="text-2xl font-bold text-[#1E1E1E]">
            Eternal <span className="text-[#C1839F]">♥</span> Fitness
          </h1>
          <h2 className="text-xl font-bold text-[#087E8B] mt-2">
            Personal Training Agreement — Signed Copy
          </h2>
          <p className="text-sm text-[#525A61] mt-1 italic">
            Signed by {data.client_name} on {formatDate(data.client_signature_date)}
          </p>
        </header>

        <div className="space-y-6 text-sm text-[#1E1E1E]">
          <section>
            <h3 className="text-base font-bold mb-3 pb-2 border-b border-[#D9D9D9]">Client Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-[#525A61] uppercase">Full name</p><p className="font-medium">{data.client_name}</p></div>
              <div><p className="text-xs text-[#525A61] uppercase">Date of birth</p><p>{formatDate(data.client_dob)}</p></div>
              <div><p className="text-xs text-[#525A61] uppercase">Email</p><p>{data.client_email}</p></div>
              <div><p className="text-xs text-[#525A61] uppercase">Phone</p><p>{data.client_phone}</p></div>
              <div className="col-span-2"><p className="text-xs text-[#525A61] uppercase">Address</p><p>{data.client_address}</p></div>
              <div><p className="text-xs text-[#525A61] uppercase">Start date</p><p>{formatDate(data.start_date)}</p></div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold mb-3 pb-2 border-b border-[#D9D9D9]">Signatures</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-3 border rounded">
                <p className="font-semibold mb-2">Client</p>
                <p className="text-xs text-[#525A61] uppercase">Name (print)</p><p className="font-medium">{data.client_name_print}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">Date</p><p>{formatDate(data.client_signature_date)}</p>
                {data.client_typed_signature && <p className="italic font-serif text-lg mt-2">{data.client_typed_signature}</p>}
                {data.client_signature_data && <img src={data.client_signature_data} alt="Signature" className="h-12 mt-2" />}
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold mb-2">Trainer (auto-signed)</p>
                <p className="text-xs text-[#525A61] uppercase">Name</p><p className="font-medium">{data.trainer_name_print}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">Date</p><p>{formatDate(data.trainer_signature_date)}</p>
                <p className="italic font-serif text-lg mt-2">{data.trainer_typed_signature}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold mb-3 pb-2 border-b border-[#D9D9D9]">PAR-Q & Medical Clearance</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-3 border rounded">
                <p className="font-semibold mb-2">PAR-Q</p>
                <p className="text-xs text-[#525A61] uppercase">Completed</p><p className="font-medium uppercase">{data.parq_completed || "—"}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">Date</p><p>{formatDate(data.parq_date)}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">Filed by</p><p>{data.parq_filed_by || "—"}</p>
              </div>
              <div className="p-3 border rounded">
                <p className="font-semibold mb-2">Medical Clearance</p>
                <p className="text-xs text-[#525A61] uppercase">Required</p><p className="font-medium uppercase">{data.medical_clearance || "—"}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">Date</p><p>{formatDate(data.medical_clearance_date)}</p>
                <p className="text-xs text-[#525A61] uppercase mt-2">From</p><p>{data.medical_clearance_from || "—"}</p>
              </div>
            </div>
          </section>

          {data.trainer_notes || data.trainer_observations || data.exercise_modifications || data.watch_for ? (
            <section>
              <h3 className="text-base font-bold mb-3 pb-2 border-b border-[#D9D9D9]">Trainer Information</h3>
              <div className="space-y-3">
                {data.package_type && <div><p className="text-xs text-[#525A61] uppercase">Package</p><p className="font-medium">{data.package_type}</p></div>}
                {data.sessions_purchased && <div><p className="text-xs text-[#525A61] uppercase">Sessions</p><p>{data.sessions_purchased} sessions × {data.session_duration}min</p></div>}
                {data.payment_status && <div><p className="text-xs text-[#525A61] uppercase">Payment</p><p className="font-medium uppercase">{data.payment_status}</p></div>}
                {data.sessions_used !== null && data.sessions_used !== undefined && <div><p className="text-xs text-[#525A61] uppercase">Sessions used / remaining</p><p>{data.sessions_used} / {data.sessions_remaining}</p></div>}
                {data.risk_level && <div><p className="text-xs text-[#525A61] uppercase">Risk level</p><p className="font-medium uppercase">{data.risk_level}</p></div>}
                {data.trainer_notes && <div><p className="text-xs text-[#525A61] uppercase">Trainer notes</p><p className="whitespace-pre-wrap">{data.trainer_notes}</p></div>}
                {data.trainer_observations && <div><p className="text-xs text-[#525A61] uppercase">Observations</p><p className="whitespace-pre-wrap">{data.trainer_observations}</p></div>}
                {data.exercise_modifications && <div><p className="text-xs text-[#525A61] uppercase">Exercise modifications</p><p className="whitespace-pre-wrap">{data.exercise_modifications}</p></div>}
                {data.watch_for && <div><p className="text-xs text-[#525A61] uppercase">Watch for</p><p className="whitespace-pre-wrap">{data.watch_for}</p></div>}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="text-base font-bold mb-3 pb-2 border-b border-[#D9D9D9]">Agreement Terms</h3>
            <p className="text-[#525A61] italic">
              The full terms of this agreement are as presented at the time of signing, covering:
              the trainer&apos;s commitments, client&apos;s responsibilities, medical clearance requirements,
              payment terms, risk and liability, data protection, and general terms.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {data.agreed_to_terms ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <p className="text-sm">Terms accepted: <span className="font-semibold">{data.agreed_to_terms ? "Yes" : "No"}</span></p>
            </div>
          </section>
        </div>

        <footer className="border-t border-[#D9D9D9] mt-8 pt-4 text-center text-xs text-[#525A61]">
          <p>Eternal <span className="text-[#C1839F]">♥</span> Fitness · Personal Training Agreement · Signed copy · Confidential — held securely on file</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/hub/agreements">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.client_name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Signed {formatDate(data.signed_at)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleEmail}
            disabled={!data.client_email}
          >
            <Send className="w-4 h-4" />
            Email
          </Button>
          <Button
            variant={editingTrainer ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setEditingTrainer(!editingTrainer)}
          >
            <Edit3 className="w-4 h-4" />
            {editingTrainer ? "Cancel" : "Edit Trainer Info"}
          </Button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {data.parq_completed === "yes" ? (
          <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> PAR-Q filed</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> PAR-Q missing</Badge>
        )}
        {data.medical_clearance === "yes" && (
          <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> Medical clearance filed</Badge>
        )}
        {data.medical_clearance === "na" && (
          <Badge variant="outline">No medical clearance needed</Badge>
        )}
        {data.medical_clearance_status && data.medical_clearance_status !== "not_required" && (
          <Badge variant={data.medical_clearance_status === "cleared" ? "default" : data.medical_clearance_status === "pending" ? "secondary" : "outline"}>
            Clearance: {data.medical_clearance_status.replace("_", " ")}
          </Badge>
        )}
        {data.client_status && (
          <Badge variant={data.client_status === "active" ? "default" : data.client_status === "inactive" ? "secondary" : "outline"}>
            {data.client_status}
          </Badge>
        )}
      </div>

      {/* Save feedback */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">Trainer information saved successfully</p>
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Client details */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Client Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full name" value={data.client_name} />
            <Field label="Date of birth" value={formatDate(data.client_dob)} />
            <Field label="Email" value={data.client_email ? (
              <span className="flex items-center gap-1">
                <a href={`mailto:${data.client_email}`} className="text-primary hover:underline">{data.client_email}</a>
                <button onClick={handleCopyEmail} className="text-muted-foreground hover:text-foreground" title="Copy email">
                  <Copy className="w-3 h-3" />
                </button>
              </span>
            ) : null} />
            <Field label="Phone" value={data.client_phone ? (
              <a href={`tel:${data.client_phone}`} className="text-primary hover:underline">{data.client_phone}</a>
            ) : null} />
            <Field label="Address" value={data.client_address} />
            <Field label="Start date" value={formatDate(data.start_date)} />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-lg border border-border/60">
              <p className="text-sm font-semibold text-foreground">Client</p>
              <Field label="Name (print)" value={data.client_name_print} />
              <Field label="Date" value={formatDate(data.client_signature_date)} />
              {data.client_typed_signature && (
                <div>
                  <p className="text-xs text-muted-foreground">Typed signature</p>
                  <p className="text-sm font-serif italic text-lg text-foreground mt-0.5">{data.client_typed_signature}</p>
                </div>
              )}
              {data.client_signature_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Drawn signature</p>
                  <div className="border border-border/60 rounded bg-white p-2 inline-block">
                    <img src={data.client_signature_data} alt="Client signature" className="h-12 w-auto" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-border/60 bg-muted/30">
              <p className="text-sm font-semibold text-foreground">Trainer (auto-signed)</p>
              <Field label="Name (print)" value={data.trainer_name_print} />
              <Field label="Date" value={formatDate(data.trainer_signature_date)} />
              {data.trainer_typed_signature && (
                <div>
                  <p className="text-xs text-muted-foreground">Typed signature</p>
                  <p className="text-sm font-serif italic text-lg text-foreground mt-0.5">{data.trainer_typed_signature}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAR-Q and Medical Clearance */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            PAR-Q & Medical Clearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-lg border border-border/60">
              <p className="text-sm font-semibold text-foreground">PAR-Q</p>
              <Field label="Completed" value={data.parq_completed === "yes" ? "Yes" : data.parq_completed === "no" ? "No" : "Not specified"} />
              <Field label="Date" value={formatDate(data.parq_date)} />
              <Field label="Filed by" value={data.parq_filed_by} />
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-border/60">
              <p className="text-sm font-semibold text-foreground">Medical Clearance</p>
              <Field label="Required" value={data.medical_clearance === "yes" ? "Yes" : data.medical_clearance === "na" ? "N/A" : "Not specified"} />
              <Field label="Date" value={formatDate(data.medical_clearance_date)} />
              <Field label="From" value={data.medical_clearance_from} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainer Information — Editable */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            Trainer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!editingTrainer ? (
            <div className="space-y-4">
              {/* Quick summary view */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Package" value={data.package_type} />
                <Field label="Sessions" value={data.sessions_purchased ? `${data.sessions_purchased} × ${data.session_duration || 60}min` : null} />
                <Field label="Payment" value={data.payment_status ? data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1) : null} />
                <Field label="Sessions used / remaining" value={data.sessions_used !== null && data.sessions_used !== undefined ? `${data.sessions_used} / ${data.sessions_remaining ?? "?"}` : null} />
                <Field label="Block expiry" value={formatDate(data.block_expiry_date)} />
                <Field label="Risk level" value={data.risk_level ? data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1) : null} />
                <Field label="Client status" value={data.client_status ? data.client_status.charAt(0).toUpperCase() + data.client_status.slice(1) : null} />
                <Field label="Referral source" value={data.referral_source} />
                <Field label="Annual review due" value={formatDate(data.annual_review_due_date)} />
              </div>

              {data.trainer_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trainer notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">{data.trainer_notes}</p>
                </div>
              )}
              {data.trainer_observations && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trainer observations</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">{data.trainer_observations}</p>
                </div>
              )}
              {data.exercise_modifications && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Exercise modifications</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">{data.exercise_modifications}</p>
                </div>
              )}
              {data.watch_for && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Watch for</p>
                  <p className="text-sm text-rose whitespace-pre-wrap bg-rose/5 rounded-md p-3 border border-rose/10">{data.watch_for}</p>
                </div>
              )}

              {!data.trainer_notes && !data.trainer_observations && !data.exercise_modifications && !data.watch_for && !data.package_type && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No trainer information added yet</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setEditingTrainer(true)}>
                    <Edit3 className="w-4 h-4" />
                    Add trainer information
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Package & Sessions */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Package & Sessions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="packageType" className="text-xs text-muted-foreground">Package type</Label>
                    <Input
                      id="packageType"
                      value={trainerForm.packageType}
                      onChange={(e) => handleTrainerChange("packageType", e.target.value)}
                      placeholder="E.g. 12-session block, Rolling monthly"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionsPurchased" className="text-xs text-muted-foreground">Sessions purchased</Label>
                    <Input
                      id="sessionsPurchased"
                      type="number"
                      min={0}
                      value={trainerForm.sessionsPurchased}
                      onChange={(e) => handleTrainerChange("sessionsPurchased", parseInt(e.target.value) || 0)}
                      placeholder="12"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionDuration" className="text-xs text-muted-foreground">Session duration (minutes)</Label>
                    <Input
                      id="sessionDuration"
                      type="number"
                      min={15}
                      step={15}
                      value={trainerForm.sessionDuration}
                      onChange={(e) => handleTrainerChange("sessionDuration", parseInt(e.target.value) || 60)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionsUsed" className="text-xs text-muted-foreground">Sessions used</Label>
                    <Input
                      id="sessionsUsed"
                      type="number"
                      min={0}
                      value={trainerForm.sessionsUsed}
                      onChange={(e) => handleTrainerChange("sessionsUsed", parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sessions remaining</Label>
                    <p className="text-lg font-semibold mt-1">{trainerForm.sessionsRemaining}</p>
                  </div>
                  <div>
                    <Label htmlFor="blockExpiryDate" className="text-xs text-muted-foreground">Block expiry date</Label>
                    <Input
                      id="blockExpiryDate"
                      type="date"
                      value={trainerForm.blockExpiryDate}
                      onChange={(e) => handleTrainerChange("blockExpiryDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Payment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod" className="text-xs text-muted-foreground">Payment method</Label>
                    <Input
                      id="paymentMethod"
                      value={trainerForm.paymentMethod}
                      onChange={(e) => handleTrainerChange("paymentMethod", e.target.value)}
                      placeholder="E.g. Bank transfer, Cash, Card"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentStatus" className="text-xs text-muted-foreground">Payment status</Label>
                    <select
                      id="paymentStatus"
                      value={trainerForm.paymentStatus}
                      onChange={(e) => handleTrainerChange("paymentStatus", e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="deposit">Deposit paid</option>
                      <option value="paid">Paid in full</option>
                      <option value="overdue">Overdue</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical Clearance Tracking */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Medical Clearance Tracking</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="medicalClearanceStatus" className="text-xs text-muted-foreground">Clearance status</Label>
                    <select
                      id="medicalClearanceStatus"
                      value={trainerForm.medicalClearanceStatus}
                      onChange={(e) => handleTrainerChange("medicalClearanceStatus", e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="not_required">Not required</option>
                      <option value="not_yet_requested">Not yet requested</option>
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="gpLetterRequestedDate" className="text-xs text-muted-foreground">GP letter requested</Label>
                    <Input
                      id="gpLetterRequestedDate"
                      type="date"
                      value={trainerForm.gpLetterRequestedDate}
                      onChange={(e) => handleTrainerChange("gpLetterRequestedDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpLetterReceivedDate" className="text-xs text-muted-foreground">GP letter received</Label>
                    <Input
                      id="gpLetterReceivedDate"
                      type="date"
                      value={trainerForm.gpLetterReceivedDate}
                      onChange={(e) => handleTrainerChange("gpLetterReceivedDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="annualReviewDueDate" className="text-xs text-muted-foreground">Annual review due</Label>
                    <Input
                      id="annualReviewDueDate"
                      type="date"
                      value={trainerForm.annualReviewDueDate}
                      onChange={(e) => handleTrainerChange("annualReviewDueDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Risk Assessment */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Risk Assessment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="riskLevel" className="text-xs text-muted-foreground">Risk level</Label>
                    <select
                      id="riskLevel"
                      value={trainerForm.riskLevel}
                      onChange={(e) => handleTrainerChange("riskLevel", e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="clientStatus" className="text-xs text-muted-foreground">Client status</Label>
                    <select
                      id="clientStatus"
                      value={trainerForm.clientStatus}
                      onChange={(e) => handleTrainerChange("clientStatus", e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="exerciseModifications" className="text-xs text-muted-foreground">Exercise modifications</Label>
                    <Textarea
                      id="exerciseModifications"
                      value={trainerForm.exerciseModifications}
                      onChange={(e) => handleTrainerChange("exerciseModifications", e.target.value)}
                      placeholder="E.g. Avoid heavy spinal loading, no impact exercises..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="watchFor" className="text-xs text-muted-foreground">Watch for</Label>
                    <Textarea
                      id="watchFor"
                      value={trainerForm.watchFor}
                      onChange={(e) => handleTrainerChange("watchFor", e.target.value)}
                      placeholder="E.g. Signs of dizziness, shortness of breath..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="trainerObservations" className="text-xs text-muted-foreground">Trainer observations</Label>
                  <Textarea
                    id="trainerObservations"
                    value={trainerForm.trainerObservations}
                    onChange={(e) => handleTrainerChange("trainerObservations", e.target.value)}
                    placeholder="General observations about the client's health, fitness, progress..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Notes & Referral */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Notes & Referral</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="trainerNotes" className="text-xs text-muted-foreground">Trainer notes</Label>
                    <Textarea
                      id="trainerNotes"
                      value={trainerForm.trainerNotes}
                      onChange={(e) => handleTrainerChange("trainerNotes", e.target.value)}
                      placeholder="Any additional notes about this client..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="referralSource" className="text-xs text-muted-foreground">Referral source</Label>
                    <Input
                      id="referralSource"
                      value={trainerForm.referralSource}
                      onChange={(e) => handleTrainerChange("referralSource", e.target.value)}
                      placeholder="E.g. Google, Friend, GP, Social media"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Save/Cancel */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5 bg-rose hover:bg-rose/90 text-white">
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save trainer information
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => { setEditingTrainer(false); setSaveError(null); }} className="gap-1.5">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreement terms */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {data.agreed_to_terms ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <p className="text-sm text-foreground">
              Terms accepted: <span className="font-semibold">{data.agreed_to_terms ? "Yes" : "No"}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Record metadata */}
      <div className="text-xs text-muted-foreground flex items-center gap-4 pt-2">
        <span>Record ID: {data.id}</span>
        <span>Trainer: {data.trainer_name}</span>
        <span>Business: {data.business_name}</span>
      </div>
    </div>
  );
}
