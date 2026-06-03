"use client";

import { useState } from "react";
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

  // Tracker state
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus | "">(
    client.clearance_status || ""
  );
  const [clearanceRequired, setClearanceRequired] = useState(client.clearance_required || "NA");
  const [annualReviewDueDate, setAnnualReviewDueDate] = useState(client.annual_review_due_date || "");
  const [trackerNotes, setTrackerNotes] = useState("");

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
        const { error } = await supabase
          .from("signed_agreements")
          .insert({
            client_id: client.client_id,
            client_name: client.client_name,
            status: agreementStatus || "draft",
            sent_date: agreementSentDate || null,
            received_date: agreementReceivedDate || null,
            requires_update: agreementRequiresUpdate,
            update_notes: agreementUpdateNotes || null,
          });

        if (error) throw error;
      }

      toast({
        title: "Agreement updated",
        description: "The agreement has been saved successfully.",
      });
      onSave();
    } catch (error: any) {
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
      if (client.parq_id) {
        const { error } = await supabase
          .from("signed_parq")
          .update({
            status: parqStatus || null,
            sent_date: parqSentDate || null,
            received_date: parqReceivedDate || null,
            requires_update: parqRequiresUpdate,
            update_notes: parqUpdateNotes || null,
          })
          .eq("id", client.parq_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("signed_parq")
          .insert({
            client_id: client.client_id,
            full_name: client.client_name,
            status: parqStatus || "draft",
            sent_date: parqSentDate || null,
            received_date: parqReceivedDate || null,
            requires_update: parqRequiresUpdate,
            update_notes: parqUpdateNotes || null,
          });

        if (error) throw error;
      }

      toast({
        title: "PAR-Q updated",
        description: "The PAR-Q form has been saved successfully.",
      });
      onSave();
    } catch (error: any) {
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

      <TabsContent value="parq" className="space-y-4 mt-4">
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
            <Input
              type="date"
              value={parqSentDate}
              onChange={(e) => setParqSentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Received Date</Label>
            <Input
              type="date"
              value={parqReceivedDate}
              onChange={(e) => setParqReceivedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Requires Update</Label>
            <Select
              value={parqRequiresUpdate ? "yes" : "no"}
              onValueChange={(v) => setParqRequiresUpdate(v === "yes")}
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
            value={parqUpdateNotes}
            onChange={(e) => setParqUpdateNotes(e.target.value)}
            placeholder="Enter notes about required updates..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
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
