import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Mail, Phone, MapPin, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default async function AgreementDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: agreement } = await supabase
    .from("signed_agreements")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agreement) {
    notFound();
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
    </div>
  );

  const formatDate = (date: string | null) => {
    if (!date) return "Not provided";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/hub/agreements">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{agreement.client_name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Signed {formatDate(agreement.signed_at)}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {agreement.parq_completed === "yes" ? (
          <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> PAR-Q filed</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> PAR-Q missing</Badge>
        )}
        {agreement.medical_clearance === "yes" && (
          <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> Medical clearance filed</Badge>
        )}
        {agreement.medical_clearance === "na" && (
          <Badge variant="outline">No medical clearance needed</Badge>
        )}
        {agreement.medical_clearance === "" && (
          <Badge variant="secondary">Medical clearance not specified</Badge>
        )}
      </div>

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
            <Field label="Full name" value={agreement.client_name} />
            <Field label="Date of birth" value={formatDate(agreement.client_dob)} />
            <Field label="Email" value={agreement.client_email ? (
              <a href={`mailto:${agreement.client_email}`} className="text-primary hover:underline">{agreement.client_email}</a>
            ) : null} />
            <Field label="Phone" value={agreement.client_phone ? (
              <a href={`tel:${agreement.client_phone}`} className="text-primary hover:underline">{agreement.client_phone}</a>
            ) : null} />
            <Field label="Address" value={agreement.client_address} />
            <Field label="Start date" value={formatDate(agreement.start_date)} />
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
            {/* Client */}
            <div className="space-y-3 p-4 rounded-lg border border-border/60">
              <p className="text-sm font-semibold text-foreground">Client</p>
              <Field label="Name (print)" value={agreement.client_name_print} />
              <Field label="Date" value={formatDate(agreement.client_signature_date)} />
              {agreement.client_typed_signature && (
                <div>
                  <p className="text-xs text-muted-foreground">Typed signature</p>
                  <p className="text-sm font-serif italic text-lg text-foreground mt-0.5">{agreement.client_typed_signature}</p>
                </div>
              )}
              {agreement.client_signature_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Drawn signature</p>
                  <div className="border border-border/60 rounded bg-white p-2 inline-block">
                    <img src={agreement.client_signature_data} alt="Client signature" className="h-12 w-auto" />
                  </div>
                </div>
              )}
            </div>

            {/* Trainer */}
            <div className="space-y-3 p-4 rounded-lg border border-border/60 bg-muted/30">
              <p className="text-sm font-semibold text-foreground">Trainer (auto-signed)</p>
              <Field label="Name (print)" value={agreement.trainer_name_print} />
              <Field label="Date" value={formatDate(agreement.trainer_signature_date)} />
              {agreement.trainer_typed_signature && (
                <div>
                  <p className="text-xs text-muted-foreground">Typed signature</p>
                  <p className="text-sm font-serif italic text-lg text-foreground mt-0.5">{agreement.trainer_typed_signature}</p>
                </div>
              )}
              {agreement.trainer_signature_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Drawn signature</p>
                  <div className="border border-border/60 rounded bg-white p-2 inline-block">
                    <img src={agreement.trainer_signature_data} alt="Trainer signature" className="h-12 w-auto" />
                  </div>
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
              <Field label="Completed" value={agreement.parq_completed === "yes" ? "Yes" : agreement.parq_completed === "no" ? "No" : "Not specified"} />
              <Field label="Date" value={formatDate(agreement.parq_date)} />
              <Field label="Filed by" value={agreement.parq_filed_by} />
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-border/60">
              <p className="text-sm font-semibold text-foreground">Medical Clearance</p>
              <Field label="Required" value={agreement.medical_clearance === "yes" ? "Yes" : agreement.medical_clearance === "na" ? "N/A" : "Not specified"} />
              <Field label="Date" value={formatDate(agreement.medical_clearance_date)} />
              <Field label="From" value={agreement.medical_clearance_from} />
            </div>
          </div>
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
            {agreement.agreed_to_terms ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <p className="text-sm text-foreground">
              Terms accepted: <span className="font-semibold">{agreement.agreed_to_terms ? "Yes" : "No"}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Record metadata */}
      <div className="text-xs text-muted-foreground flex items-center gap-4 pt-2">
        <span>Record ID: {agreement.id}</span>
        <span>Trainer: {agreement.trainer_name}</span>
        <span>Business: {agreement.business_name}</span>
      </div>
    </div>
  );
}
