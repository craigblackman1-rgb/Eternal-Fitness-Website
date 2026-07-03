"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus, IconAlertTriangle, IconCheckCircle, IconFileText, IconEdit3, IconTrash2, IconX, IconClipboardCheck } from "@/components/icons";
import { EmptyState } from "@/components/hub/EmptyState";
import { KpiTile } from "@/components/hub/KpiTile";
import { format, addMonths, parseISO } from "date-fns";
import { toast } from "sonner";

// Conditions that AUTOMATICALLY require clearance (non-negotiable)
const AUTO_CLEARANCE_CONDITIONS = [
  // Implanted medical devices
  "shunt", "pacemaker", "defibrillator", "neurostimulator", "insulin pump",
  // Anticoagulants
  "warfarin", "apixaban", "rivaroxaban", "dabigatran", "clopidogrel",
  // Haematological conditions
  "prv", "polycythaemia rubra vera", "haemophilia", "leukaemia", "thrombocytopenia", "haematological", "hematological",
  // Type 1 diabetes
  "type 1 diabetes", "type 1 diabetic",
  // Uncontrolled hypertension (not "hypertension" which catches "controlled hypertension")
  "uncontrolled hypertension", "systolic", "diastolic",
  // Cancer treatment
  "active cancer", "cancer treatment", "chemotherapy", "radiotherapy",
  // Uncontrolled epilepsy
  "epilepsy", "uncontrolled epilepsy",
  // Neurological conditions
  "stroke", "ms", "multiple sclerosis", "parkinson", "parkinsons",
  "neurological condition", "affecting balance", "affecting coordination", "affecting sensation",
  // Consultant-given restrictions
  "consultant restriction", "consultant advised", "told not to exercise", "advised to restrict",
  // Recent surgery (checked with date logic)
  "recent surgery", "post-operative", "post-op", "surgery within",
];

// Conditions that trigger case-by-case assessment
const CASE_BY_CASE_CONDITIONS = [
  "type 2 diabetes", "type 2 diabetic",
  "controlled hypertension",
  "osteoporosis",
  "chronic heart", "chronic heart disease", "heart disease", "heart failure",
  "copd", "asthma", "respiratory condition", "respiratory disease",
];

interface TrackerRow {
  id: string;
  client_name: string;
  date_of_birth: string | null;
  parq_received_date: string | null;
  contract_signed_date: string | null;
  clearance_required: "Y" | "N" | "NA";
  conditions_requiring_clearance: string | null;
  clearance_from: string | null;
  specialist_name: string | null;
  gp_letter_requested_date: string | null;
  gp_letter_received_date: string | null;
  clearance_status: "CLEARED" | "PENDING" | "NOT YET REQUESTED" | "NOT REQUIRED";
  clearance_filed: "Y" | "N";
  annual_review_due_date: string | null;
  last_session_delivered: string | null;
  surgery_date: string | null;
  notes: string | null;
}

function isRecentSurgery(surgeryDate: string | null): boolean {
  if (!surgeryDate) return false;
  const today = new Date();
  const surgery = new Date(surgeryDate);
  const weeksSince = (today.getTime() - surgery.getTime()) / (1000 * 60 * 60 * 24 * 7);
  return weeksSince <= 12;
}

function computeFlag(row: TrackerRow): { label: string; variant: "ok" | "na" | "chase" | "check" | "urgent" | "assess" } {
  const { auto: detectedAuto, caseByCase: detectedCase } = detectConditions(row.conditions_requiring_clearance || "");
  const hasRecentSurgery = (row.conditions_requiring_clearance || "").toLowerCase().includes("surgery") && isRecentSurgery(row.surgery_date);
  const autoFlagDetected = detectedAuto.length > 0 || hasRecentSurgery;
  const effectiveClearanceRequired = autoFlagDetected || row.clearance_required === "Y";

  if (!effectiveClearanceRequired) {
    return { label: "N/A", variant: "na" };
  }

  if (row.clearance_status === "CLEARED") {
    if (row.clearance_filed !== "Y") {
      return { label: "Check", variant: "check" };
    }
    return { label: "OK", variant: "ok" };
  }

  if (autoFlagDetected) {
    return { label: "URGENT", variant: "urgent" };
  }

  if (detectedCase.length > 0 && row.clearance_required === "NA") {
    return { label: "ASSESS", variant: "assess" };
  }

  return { label: "Chase", variant: "chase" };
}

function detectConditions(text: string): { auto: string[]; caseByCase: string[] } {
  const lower = text.toLowerCase();
  const auto: string[] = [];
  const caseByCase: string[] = [];

  AUTO_CLEARANCE_CONDITIONS.forEach((cond) => {
    if (lower.includes(cond)) {
      auto.push(cond);
    }
  });

  CASE_BY_CASE_CONDITIONS.forEach((cond) => {
    if (lower.includes(cond)) {
      caseByCase.push(cond);
    }
  });

  return { auto, caseByCase };
}

const emptyForm = {
  client_name: "",
  date_of_birth: "",
  parq_received_date: "",
  contract_signed_date: "",
  clearance_required: "NA" as "Y" | "N" | "NA",
  conditions_requiring_clearance: "",
  clearance_from: "",
  specialist_name: "",
  gp_letter_requested_date: "",
  gp_letter_received_date: "",
  clearance_status: "NOT REQUIRED" as "CLEARED" | "PENDING" | "NOT YET REQUESTED" | "NOT REQUIRED",
  clearance_filed: "N" as "Y" | "N",
  annual_review_due_date: "",
  last_session_delivered: "",
  surgery_date: "",
  notes: "",
};

export default function TrackerPage() {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TrackerRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detectedAuto, setDetectedAuto] = useState<string[]>([]);
  const [detectedCase, setDetectedCase] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFlag, setFilterFlag] = useState<string>("all");

  const supabase = createClient();

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from("client_tracker")
      .select("*")
      .order("client_name", { ascending: true });
    if (error) {
      toast.error("Failed to load tracker");
      return;
    }
    setRows(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleConditionsChange = (value: string) => {
    setForm({ ...form, conditions_requiring_clearance: value });
    const { auto, caseByCase } = detectConditions(value);
    setDetectedAuto(auto);
    setDetectedCase(caseByCase);

    if (auto.length > 0) {
      setForm((prev) => ({
        ...prev,
        clearance_required: "Y",
        clearance_status: prev.clearance_status === "NOT REQUIRED" ? "NOT YET REQUESTED" : prev.clearance_status,
      }));
    }
  };

  const handleParqDateChange = (value: string) => {
    setForm({ ...form, parq_received_date: value });
    if (value) {
      const reviewDate = addMonths(parseISO(value), 12);
      setForm((prev) => ({
        ...prev,
        annual_review_due_date: format(reviewDate, "yyyy-MM-dd"),
      }));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRow(null);
    setDetectedAuto([]);
    setDetectedCase([]);
  };

  const openEdit = (row: TrackerRow) => {
    setEditingRow(row);
    setForm({
      client_name: row.client_name,
      date_of_birth: row.date_of_birth || "",
      parq_received_date: row.parq_received_date || "",
      contract_signed_date: row.contract_signed_date || "",
      clearance_required: row.clearance_required,
      conditions_requiring_clearance: row.conditions_requiring_clearance || "",
      clearance_from: row.clearance_from || "",
      specialist_name: row.specialist_name || "",
      gp_letter_requested_date: row.gp_letter_requested_date || "",
      gp_letter_received_date: row.gp_letter_received_date || "",
      clearance_status: row.clearance_status,
      clearance_filed: row.clearance_filed,
      annual_review_due_date: row.annual_review_due_date || "",
      last_session_delivered: row.last_session_delivered || "",
      surgery_date: row.surgery_date || "",
      notes: row.notes || "",
    });
    const { auto, caseByCase } = detectConditions(row.conditions_requiring_clearance || "");
    setDetectedAuto(auto);
    setDetectedCase(caseByCase);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim()) {
      toast.error("Client name is required");
      return;
    }

    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      parq_received_date: form.parq_received_date || null,
      contract_signed_date: form.contract_signed_date || null,
      conditions_requiring_clearance: form.conditions_requiring_clearance || null,
      clearance_from: form.clearance_from || null,
      specialist_name: form.specialist_name || null,
      gp_letter_requested_date: form.gp_letter_requested_date || null,
      gp_letter_received_date: form.gp_letter_received_date || null,
      annual_review_due_date: form.annual_review_due_date || null,
      last_session_delivered: form.last_session_delivered || null,
      surgery_date: form.surgery_date || null,
      notes: form.notes || null,
    };

    if (editingRow) {
      const { error } = await supabase
        .from("client_tracker")
        .update(payload)
        .eq("id", editingRow.id);
      if (error) {
        toast.error("Failed to update row");
        return;
      }
      toast.success("Client updated");
    } else {
      const { error } = await supabase
        .from("client_tracker")
        .insert(payload);
      if (error) {
        toast.error("Failed to add client");
        return;
      }
      toast.success("Client added");
    }

    setDialogOpen(false);
    resetForm();
    fetchRows();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client from the tracker?")) return;
    const { error } = await supabase.from("client_tracker").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Client removed");
    fetchRows();
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.conditions_requiring_clearance || "").toLowerCase().includes(searchTerm.toLowerCase());
    const flag = computeFlag(row);
    const matchesFilter = filterFlag === "all" || flag.variant === filterFlag;
    return matchesSearch && matchesFilter;
  });

  const flagSummary = {
    ok: rows.filter((r) => computeFlag(r).variant === "ok").length,
    na: rows.filter((r) => computeFlag(r).variant === "na").length,
    chase: rows.filter((r) => computeFlag(r).variant === "chase").length,
    check: rows.filter((r) => computeFlag(r).variant === "check").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Medical Clearance Tracker</h1>
          <p className="text-muted-foreground mt-1">Track PAR-Qs, clearance letters, and annual reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRow ? "Edit Client" : "Add Client to Tracker"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PAR-Q Received Date</Label>
                  <Input
                    type="date"
                    value={form.parq_received_date}
                    onChange={(e) => handleParqDateChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Signed Date</Label>
                  <Input
                    type="date"
                    value={form.contract_signed_date}
                    onChange={(e) => setForm({ ...form, contract_signed_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clearance Required?</Label>
                <Select
                  value={form.clearance_required}
                  onValueChange={(v) => setForm({ ...form, clearance_required: v as "Y" | "N" | "NA" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Yes — clearance needed</SelectItem>
                    <SelectItem value="N">No clearance needed</SelectItem>
                    <SelectItem value="NA">Not applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Conditions Requiring Clearance</Label>
                <Textarea
                  value={form.conditions_requiring_clearance}
                  onChange={(e) => handleConditionsChange(e.target.value)}
                  placeholder="e.g. Warfarin, lumbar peritoneal shunt"
                  rows={2}
                />
                {detectedAuto.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose/5 border border-rose/10 p-3 text-sm text-rose">
                    <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Auto-clearance triggered:</p>
                      <p>{detectedAuto.join(", ")}</p>
                      <p className="mt-1 text-xs opacity-80">Clearance requirement set to Yes automatically.</p>
                    </div>
                  </div>
                )}
                {detectedCase.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-teal/5 border border-teal/10 p-3 text-sm text-teal">
                    <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Case-by-case assessment:</p>
                      <p>{detectedCase.join(", ")}</p>
                      <p className="mt-1 text-xs opacity-80">Review severity before deciding on clearance.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clearance From</Label>
                  <Input
                    value={form.clearance_from}
                    onChange={(e) => setForm({ ...form, clearance_from: e.target.value })}
                    placeholder="GP, Haematologist, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialist Name</Label>
                  <Input
                    value={form.specialist_name}
                    onChange={(e) => setForm({ ...form, specialist_name: e.target.value })}
                    placeholder="If applicable"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GP Letter Requested</Label>
                  <Input
                    type="date"
                    value={form.gp_letter_requested_date}
                    onChange={(e) => setForm({ ...form, gp_letter_requested_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GP Letter Received</Label>
                  <Input
                    type="date"
                    value={form.gp_letter_received_date}
                    onChange={(e) => setForm({ ...form, gp_letter_received_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clearance Status</Label>
                  <Select
                    value={form.clearance_status}
                    onValueChange={(v) => setForm({ ...form, clearance_status: v as TrackerRow["clearance_status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLEARED">CLEARED</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="NOT YET REQUESTED">NOT YET REQUESTED</SelectItem>
                      <SelectItem value="NOT REQUIRED">NOT REQUIRED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Clearance Filed?</Label>
                  <Select
                    value={form.clearance_filed}
                    onValueChange={(v) => setForm({ ...form, clearance_filed: v as "Y" | "N" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes — filed</SelectItem>
                      <SelectItem value="N">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(form.conditions_requiring_clearance.toLowerCase().includes("surgery")) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-teal">Surgery Date</Label>
                    <Input
                      type="date"
                      value={form.surgery_date}
                      onChange={(e) => setForm({ ...form, surgery_date: e.target.value })}
                      className="border-teal/30"
                    />
                    <p className="text-xs text-teal">Required for surgery conditions. Auto-flagged if within 12 weeks.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Review Due</Label>
                  <Input
                    type="date"
                    value={form.annual_review_due_date}
                    onChange={(e) => setForm({ ...form, annual_review_due_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Auto-set to 12 months from PAR-Q date</p>
                </div>
                <div className="space-y-2">
                  <Label>Last Session Delivered</Label>
                  <Input
                    type="date"
                    value={form.last_session_delivered}
                    onChange={(e) => setForm({ ...form, last_session_delivered: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Injection schedule, consultant name, restrictions..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="rounded-full bg-rose hover:bg-rose/90 text-white">
                {editingRow ? "Save Changes" : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards — KpiTile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile icon={<IconClipboardCheck className="w-4 h-4" />} label="Total Clients" value={rows.length} statusToken="primary" />
        <KpiTile icon={<IconCheckCircle className="w-4 h-4" />} label="Cleared / OK" value={flagSummary.ok + flagSummary.na} statusToken="success" />
        <KpiTile icon={<IconAlertTriangle className="w-4 h-4" />} label="Chase" value={flagSummary.chase} statusToken="warning" />
        <KpiTile icon={<IconAlertTriangle className="w-4 h-4" />} label="Check" value={flagSummary.check} statusToken="warning" />
      </div>

      {/* Search and filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Search clients or conditions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm rounded-xl border-border/60"
        />
        <Select value={filterFlag} onValueChange={setFilterFlag}>
          <SelectTrigger className="w-40 rounded-xl border-border/60">
            <SelectValue placeholder="Filter by flag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="na">N/A</SelectItem>
            <SelectItem value="chase">Chase</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filteredRows.length === 0 ? (
        <Card className="shadow-sm bg-[var(--hub-card)] rounded-2xl border border-[var(--hub-border)]">
          <CardContent>
            <EmptyState icon={<IconFileText className="w-9 h-9" />} title="No clients in tracker yet" description="Add your first client to start tracking clearances" cta={{ label: "Add First Client", onClick: () => { resetForm(); setDialogOpen(true); } }} />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/60 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="sticky left-0 bg-card z-10">Client</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Clearance Required</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Clearance From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead>PAR-Q Received</TableHead>
                <TableHead>Annual Review Due</TableHead>
                <TableHead>Last Session</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const flag = computeFlag(row);
                const flagStyles: Record<string, string> = {
                  ok: "bg-teal/10 text-teal",
                  na: "bg-slate/10 text-slate",
                  chase: "bg-rose/10 text-rose",
                  check: "bg-dark-navy/10 text-dark-navy",
                  urgent: "bg-rose text-white",
                  assess: "bg-teal/10 text-teal",
                };
                return (
                  <TableRow key={row.id} className="border-border/60">
                    <TableCell className="sticky left-0 bg-card z-10 font-semibold">
                      {row.client_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-full ${flagStyles[flag.variant] || "bg-muted text-muted-foreground"}`}
                        variant="outline"
                      >
                        {flag.variant === "ok" && <IconCheckCircle className="mr-1 h-3 w-3" />}
                        {(flag.variant === "chase" || flag.variant === "check" || flag.variant === "urgent" || flag.variant === "assess") && (
                          <IconAlertTriangle className="mr-1 h-3 w-3" />
                        )}
                        {flag.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.clearance_required === "Y" ? (
                        <span className="text-rose font-semibold">Yes</span>
                      ) : row.clearance_required === "N" ? (
                        "No"
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate" title={row.conditions_requiring_clearance || ""}>
                      {row.conditions_requiring_clearance || "—"}
                    </TableCell>
                    <TableCell>{row.clearance_from || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">{row.clearance_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.clearance_filed === "Y" ? (
                        <IconCheckCircle className="h-4 w-4 text-teal" />
                      ) : (
                        <IconX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.parq_received_date ? format(parseISO(row.parq_received_date), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.annual_review_due_date ? (
                        <span
                          className={
                            new Date(row.annual_review_due_date) < new Date()
                              ? "text-rose font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {format(parseISO(row.annual_review_due_date), "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.last_session_delivered
                        ? format(parseISO(row.last_session_delivered), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-rose/10 hover:text-rose" onClick={() => openEdit(row)}>
                          <IconEdit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-rose/10 hover:text-rose" onClick={() => handleDelete(row.id)}>
                          <IconTrash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Rules reminder — branded */}
      <Card className="bg-off-white/60 border-border/60 rounded-2xl">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal/10 flex items-center justify-center">
              <IconClipboardCheck className="w-3.5 h-3.5 text-teal" />
            </div>
            Rules — Always Follow
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <IconAlertTriangle className="h-4 w-4 text-rose mt-0.5 shrink-0" />
              Never deliver a session to a client with Chase or Check in the Flag column.
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="h-4 w-4 text-teal mt-0.5 shrink-0" />
              Check the Flag column before booking or confirming any new session block.
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="h-4 w-4 text-teal mt-0.5 shrink-0" />
              Update the tracker the same day you receive any PAR-Q or clearance letter.
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="h-4 w-4 text-teal mt-0.5 shrink-0" />
              Set a calendar reminder for every annual review date so PAR-Qs never go out of date.
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="h-4 w-4 text-teal mt-0.5 shrink-0" />
              If a client discloses a new condition between reviews, update their row immediately.
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="h-4 w-4 text-teal mt-0.5 shrink-0" />
              Print or save each completed PAR-Q as a PDF and file alongside the signed contract.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
