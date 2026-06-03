"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { ClientDocumentsSummary, DocumentStatus, ClearanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentEditorProps {
  client: ClientDocumentsSummary;
  documentType: "agreement" | "parq" | "tracker";
  onSave: () => void;
}

export function DocumentEditor({ client, documentType, onSave }: DocumentEditorProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Agreement state
  const [agreementStatus, setAgreementStatus] = useState<DocumentStatus | "">(
    client.agreement_status || ""
  );
  const [agreementSentDate, setAgreementSentDate] = useState(client.agreement_sent_date || "");
  const [agreementReceivedDate, setAgreementReceivedDate] = useState(client.agreement_received_date || "");
  const [agreementRequiresUpdate, setAgreementRequiresUpdate] = useState(
    client.agreement_requires_update || false
  );
  const [agreementUpdateNotes, setAgreementUpdateNotes] = useState(client.agreement_update_notes || "");

  // PAR-Q state
  const [parqStatus, setParqStatus] = useState<DocumentStatus | "">(client.parq_status || "");
  const [parqSentDate, setParqSentDate] = useState(client.parq_sent_date || "");
  const [parqReceivedDate, setParqReceivedDate] = useState(client.parq_received_date || "");
  const [parqRequiresUpdate, setParqRequiresUpdate] = useState(client.parq_requires_update || false);
  const [parqUpdateNotes, setParqUpdateNotes] = useState(client.parq_update_notes || "");

  // PAR-Q answers state
  const [parqAnswers, setParqAnswers] = useState({
    q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "", q11: "",
    q12: "", q13: "", q14: "", q15: "", q16: "", q17: "", q18: "",
    q19: "", q20: "", q21: "", q22: "", q23: "", q24: "", q25: "", q26: "",
    q27: "", q28: "", q29: "",
    conditions: "",
    medications: "",
    devices: "",
    exercise_restrictions: "",
    surgeries: "",
    other_info: "",
    current_exercise: "",
    training_goals: "",
    full_name: "",
    date_of_birth: "",
    address: "",
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    gp_name: "",
    gp_surgery: "",
    gp_phone: "",
    client_name_print: "",
    client_signature_date: "",
    client_typed_signature: "",
  });
  const [parqAnswersLoaded, setParqAnswersLoaded] = useState(false);

  useEffect(() => {
    if (documentType === "parq" && client.parq_id && !parqAnswersLoaded) {
      loadParqAnswers();
    }
  }, [documentType, client.parq_id]);

  const loadParqAnswers = async () => {
    if (!client.parq_id) return;
    try {
      const { data, error } = await supabase
        .from("signed_parq")
        .select("*")
        .eq("id", client.parq_id)
        .single();

      if (error) throw error;
      if (data) {
        setParqAnswers({
          q1: data.q1 || "", q2: data.q2 || "", q3: data.q3 || "", q4: data.q4 || "", q5: data.q5 || "",
          q6: data.q6 || "", q7: data.q7 || "", q8: data.q8 || "", q9: data.q9 || "", q10: data.q10 || "",
          q11: data.q11 || "", q12: data.q12 || "", q13: data.q13 || "", q14: data.q14 || "", q15: data.q15 || "",
          q16: data.q16 || "", q17: data.q17 || "", q18: data.q18 || "",
          q19: data.q19 || "", q20: data.q20 || "", q21: data.q21 || "", q22: data.q22 || "", q23: data.q23 || "",
          q24: data.q24 || "", q25: data.q25 || "", q26: data.q26 || "",
          q27: data.q27 || "", q28: data.q28 || "", q29: data.q29 || "",
          conditions: data.conditions || "",
          medications: data.medications || "",
          devices: data.devices || "",
          exercise_restrictions: data.exercise_restrictions || "",
          surgeries: data.surgeries || "",
          other_info: data.other_info || "",
          current_exercise: data.current_exercise || "",
          training_goals: data.training_goals || "",
          full_name: data.full_name || "",
          date_of_birth: data.date_of_birth || "",
          address: data.address || "",
          email: data.email || "",
          phone: data.phone || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          gp_name: data.gp_name || "",
          gp_surgery: data.gp_surgery || "",
          gp_phone: data.gp_phone || "",
          client_name_print: data.client_name_print || "",
          client_signature_date: data.client_signature_date || "",
          client_typed_signature: data.client_typed_signature || "",
        });
        setParqAnswersLoaded(true);
      }
    } catch (error) {
      console.error("Error loading PAR-Q answers:", error);
    }
  };

  const handleParqAnswerChange = (field: string, value: string) => {
    setParqAnswers((prev) => ({ ...prev, [field]: value }));
  };

  // Tracker state
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus | "">(
    client.clearance_status || ""
  );
  const [clearanceRequired, setClearanceRequired] = useState(client.clearance_required || "NA");
  const [annualReviewDueDate, setAnnualReviewDueDate] = useState(client.annual_review_due_date || "");
  const [trackerNotes, setTrackerNotes] = useState(client.tracker_notes || "");

  const handleSaveAgreement = async () => {
    setLoading(true);
    try {
      if (client.agreement_id) {
        const { error } = await supabase
          .from("signed_agreements")
          .update({
            status: agreementStatus || null,
            sent_date: agreementSentDate || null,
            received_date: agreementReceivedDate || null,
            requires_update: agreementRequiresUpdate,
            update_notes: agreementUpdateNotes || null,
          })
          .eq("id", client.agreement_id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("signed_agreements")
          .insert({
            client_id: client.client_id,
            client_name: client.client_name,
            trainer_name: "Esther Fair",
            business_name: "Eternal Fitness",
            trainer_name_print: "Esther Fair",
            trainer_typed_signature: "Esther Fair",
            status: agreementStatus || "draft",
            sent_date: agreementSentDate || null,
            received_date: agreementReceivedDate || null,
            requires_update: agreementRequiresUpdate,
            update_notes: agreementUpdateNotes || null,
            parq_completed: "",
            medical_clearance: "",
            agreed_to_terms: false,
          })
          .select()
          .single();

        if (error) throw error;
        console.log("Created agreement:", data);
      }

      toast({
        title: "Agreement saved",
        description: "The agreement has been saved successfully.",
      });
      onSave();
    } catch (error: any) {
      console.error("Agreement save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save agreement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePARQ = async () => {
    setLoading(true);
    try {
      const payload = {
        status: parqStatus || null,
        sent_date: parqSentDate || null,
        received_date: parqReceivedDate || null,
        requires_update: parqRequiresUpdate,
        update_notes: parqUpdateNotes || null,
        ...parqAnswers,
        date_of_birth: parqAnswers.date_of_birth || null,
        client_signature_date: parqAnswers.client_signature_date || null,
      };

      if (client.parq_id) {
        const { error } = await supabase
          .from("signed_parq")
          .update(payload)
          .eq("id", client.parq_id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("signed_parq")
          .insert({
            client_id: client.client_id,
            full_name: parqAnswers.full_name || client.client_name,
            status: parqStatus || "draft",
            ...payload,
          })
          .select()
          .single();

        if (error) throw error;
        console.log("Created PAR-Q:", data);
      }

      toast({
        title: "PAR-Q saved",
        description: "The PAR-Q form has been saved successfully.",
      });
      onSave();
    } catch (error: any) {
      console.error("PAR-Q save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save PAR-Q",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTracker = async () => {
    setLoading(true);
    try {
      if (client.tracker_id) {
        const { error } = await supabase
          .from("client_tracker")
          .update({
            clearance_status: clearanceStatus || null,
            clearance_required: clearanceRequired,
            annual_review_due_date: annualReviewDueDate || null,
            notes: trackerNotes || null,
          })
          .eq("id", client.tracker_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_tracker")
          .insert({
            client_id: client.client_id,
            client_name: client.client_name,
            clearance_status: clearanceStatus || "NOT YET REQUESTED",
            clearance_required: clearanceRequired,
            annual_review_due_date: annualReviewDueDate || null,
            notes: trackerNotes || null,
          });

        if (error) throw error;
      }

      toast({
        title: "Tracker updated",
        description: "The medical tracker has been saved successfully.",
      });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tracker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue={documentType}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="agreement">Agreement</TabsTrigger>
        <TabsTrigger value="parq">PAR-Q</TabsTrigger>
        <TabsTrigger value="tracker">Medical Tracker</TabsTrigger>
      </TabsList>

      <TabsContent value="agreement" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={agreementStatus} onValueChange={(v) => setAgreementStatus(v as DocumentStatus | "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="needs_update">Needs Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sent Date</Label>
            <Input
              type="date"
              value={agreementSentDate}
              onChange={(e) => setAgreementSentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Received Date</Label>
            <Input
              type="date"
              value={agreementReceivedDate}
              onChange={(e) => setAgreementReceivedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Requires Update</Label>
            <Select
              value={agreementRequiresUpdate ? "yes" : "no"}
              onValueChange={(v) => setAgreementRequiresUpdate(v === "yes")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Update Notes</Label>
          <Textarea
            value={agreementUpdateNotes}
            onChange={(e) => setAgreementUpdateNotes(e.target.value)}
            placeholder="Enter notes about required updates..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleSaveAgreement} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Agreement"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="parq" className="space-y-6 mt-4">
        {/* Status & Admin */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Admin Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={parqStatus} onValueChange={(v) => setParqStatus(v as DocumentStatus | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="needs_update">Needs Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sent Date</Label>
              <Input type="date" value={parqSentDate} onChange={(e) => setParqSentDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Received Date</Label>
              <Input type="date" value={parqReceivedDate} onChange={(e) => setParqReceivedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Requires Update</Label>
              <Select value={parqRequiresUpdate ? "yes" : "no"} onValueChange={(v) => setParqRequiresUpdate(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Update Notes</Label>
            <Textarea value={parqUpdateNotes} onChange={(e) => setParqUpdateNotes(e.target.value)} placeholder="Enter notes..." rows={2} />
          </div>
        </div>

        {/* Section 1: Personal Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Section 1 — Personal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full name</Label>
              <Input value={parqAnswers.full_name} onChange={(e) => handleParqAnswerChange("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input type="date" value={parqAnswers.date_of_birth} onChange={(e) => handleParqAnswerChange("date_of_birth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={parqAnswers.email} onChange={(e) => handleParqAnswerChange("email", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input value={parqAnswers.address} onChange={(e) => handleParqAnswerChange("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={parqAnswers.phone} onChange={(e) => handleParqAnswerChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emergency contact name</Label>
              <Input value={parqAnswers.emergency_contact_name} onChange={(e) => handleParqAnswerChange("emergency_contact_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emergency contact phone</Label>
              <Input value={parqAnswers.emergency_contact_phone} onChange={(e) => handleParqAnswerChange("emergency_contact_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GP name</Label>
              <Input value={parqAnswers.gp_name} onChange={(e) => handleParqAnswerChange("gp_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GP surgery</Label>
              <Input value={parqAnswers.gp_surgery} onChange={(e) => handleParqAnswerChange("gp_surgery", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GP phone</Label>
              <Input value={parqAnswers.gp_phone} onChange={(e) => handleParqAnswerChange("gp_phone", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold border-b pb-2">Section 2 — Cardiovascular and General Health</h3>
          {[
            { q: "q1", text: "Heart condition or cardiovascular disease" },
            { q: "q2", text: "Chest pain/pressure/tightness during activity" },
            { q: "q3", text: "Chest pain or discomfort at rest" },
            { q: "q4", text: "Dizzy, faint, or lose consciousness" },
            { q: "q5", text: "Unexplained shortness of breath" },
            { q: "q6", text: "High cholesterol or treated for it" },
            { q: "q7", text: "Palpitations, irregular heartbeat, or racing heart" },
            { q: "q8", text: "High blood pressure or treated for it" },
            { q: "q9", text: "Stroke or TIA" },
            { q: "q10", text: "Diabetes (Type 1 or Type 2)" },
            { q: "q11", text: "Smoke or smoked in last 5 years" },
          ].map(({ q, text }) => (
            <div key={q} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
              <span className="text-sm">{text}</span>
              <Select value={parqAnswers[q as keyof typeof parqAnswers] as string} onValueChange={(v) => handleParqAnswerChange(q, v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold border-b pb-2">Section 3 — Musculoskeletal, Neurological, Surgical</h3>
          {[
            { q: "q12", text: "Bone, joint, or muscle condition" },
            { q: "q13", text: "Surgery in last 5 years" },
            { q: "q14", text: "Implanted medical devices" },
            { q: "q15", text: "Spinal injury/surgery or avoid spinal loading" },
            { q: "q16", text: "Neurological condition" },
            { q: "q17", text: "Chronic pain affecting exercise" },
            { q: "q18", text: "Vision, hearing, or other sense condition" },
          ].map(({ q, text }) => (
            <div key={q} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
              <span className="text-sm">{text}</span>
              <Select value={parqAnswers[q as keyof typeof parqAnswers] as string} onValueChange={(v) => handleParqAnswerChange(q, v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold border-b pb-2">Section 4 — Blood, Medications, Diagnosed Conditions</h3>
          {[
            { q: "q19", text: "Blood-thinning medication (anticoagulants)" },
            { q: "q20", text: "Blood disorder" },
            { q: "q21", text: "Injection-based medication regularly" },
            { q: "q22", text: "Statin medication" },
            { q: "q23", text: "Other prescription medication" },
            { q: "q24", text: "Diagnosed medical condition not disclosed" },
            { q: "q25", text: "Advised to restrict exercise" },
            { q: "q26", text: "Major illness/hospital admission/operation in last 5 years" },
          ].map(({ q, text }) => (
            <div key={q} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
              <span className="text-sm">{text}</span>
              <Select value={parqAnswers[q as keyof typeof parqAnswers] as string} onValueChange={(v) => handleParqAnswerChange(q, v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Section 5 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Section 5 — Full Details</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Diagnosed medical conditions</Label>
              <Textarea value={parqAnswers.conditions} onChange={(e) => handleParqAnswerChange("conditions", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>All current prescription medications</Label>
              <Textarea value={parqAnswers.medications} onChange={(e) => handleParqAnswerChange("medications", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Implanted medical devices</Label>
              <Textarea value={parqAnswers.devices} onChange={(e) => handleParqAnswerChange("devices", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Exercise restrictions</Label>
              <Textarea value={parqAnswers.exercise_restrictions} onChange={(e) => handleParqAnswerChange("exercise_restrictions", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Surgeries or hospital admissions (last 5 years)</Label>
              <Textarea value={parqAnswers.surgeries} onChange={(e) => handleParqAnswerChange("surgeries", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Any other information</Label>
              <Textarea value={parqAnswers.other_info} onChange={(e) => handleParqAnswerChange("other_info", e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Section 6 — Lifestyle and Physical Activity</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Current exercise or sport</Label>
              <Textarea value={parqAnswers.current_exercise} onChange={(e) => handleParqAnswerChange("current_exercise", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Training goals</Label>
              <Textarea value={parqAnswers.training_goals} onChange={(e) => handleParqAnswerChange("training_goals", e.target.value)} rows={2} />
            </div>
          </div>
          {[
            { q: "q27", text: "Pregnant or given birth in last 6 months" },
            { q: "q28", text: "Dietary restrictions, allergies, or eating disorder" },
            { q: "q29", text: "Other reason unable to participate safely" },
          ].map(({ q, text }) => (
            <div key={q} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
              <span className="text-sm">{text}</span>
              <Select value={parqAnswers[q as keyof typeof parqAnswers] as string} onValueChange={(v) => handleParqAnswerChange(q, v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Section 9 — Declaration and Signature</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client name (print)</Label>
              <Input value={parqAnswers.client_name_print} onChange={(e) => handleParqAnswerChange("client_name_print", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Signature date</Label>
              <Input type="date" value={parqAnswers.client_signature_date} onChange={(e) => handleParqAnswerChange("client_signature_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Typed signature</Label>
              <Input value={parqAnswers.client_typed_signature} onChange={(e) => handleParqAnswerChange("client_typed_signature", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={handleSavePARQ} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save PAR-Q"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="tracker" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Clearance Status</Label>
            <Select value={clearanceStatus} onValueChange={(v) => setClearanceStatus(v as ClearanceStatus | "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEARED">Cleared</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="NOT YET REQUESTED">Not Yet Requested</SelectItem>
                <SelectItem value="NOT REQUIRED">Not Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Clearance Required</Label>
            <Select value={clearanceRequired} onValueChange={(v) => setClearanceRequired(v as "Y" | "N" | "NA")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Y">Yes</SelectItem>
                <SelectItem value="N">No</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Annual Review Due Date</Label>
            <Input
              type="date"
              value={annualReviewDueDate}
              onChange={(e) => setAnnualReviewDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={trackerNotes}
            onChange={(e) => setTrackerNotes(e.target.value)}
            placeholder="Enter medical tracker notes..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleSaveTracker} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Tracker"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
