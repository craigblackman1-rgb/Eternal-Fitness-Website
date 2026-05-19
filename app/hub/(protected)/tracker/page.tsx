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
import { Plus, AlertTriangle, CheckCircle, FileText, Edit2, Trash2, X } from "lucide-react";
import { format, addMonths, parseISO } from "date-fns";
import { toast } from "sonner";

// Conditions that AUTOMATICALLY require clearance (non-negotiable)
const AUTO_CLEARANCE_CONDITIONS = [
  "shunt", "pacemaker", "defibrillator", "neurostimulator", "insulin pump",
  "warfarin", "apixaban", "rivaroxaban", "dabigatran", "clopidogrel",
  "prv", "haemophilia", "leukaemia", "thrombocytopenia",
  "hypertension", "epilepsy", "type 1 diabetes", "type 1 diabetic",
  "cancer", "chemotherapy", "radiotherapy",
  "balance", "coordination", "sensation",
  "stroke", "ms", "multiple sclerosis", "parkinson",
  "haematological", "hematological",
];

// Conditions that trigger case-by-case assessment
const CASE_BY_CASE_CONDITIONS = [
  "type 2 diabetes", "type 2 diabetic",
  "controlled hypertension",
  "osteoporosis",
  "chronic heart", "heart disease",
  "copd", "asthma", "respiratory",
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
  notes: string | null;
}

function computeFlag(row: TrackerRow): { label: string; variant: "ok" | "na" | "chase" | "check" } {
  if (row.clearance_required === "NA" || row.clearance_required === "N") {
    return { label: "N/A", variant: "na" };
  }
  if (row.clearance_status === "CLEARED") {
    if (row.clearance_filed !== "Y") {
      return { label: "Check", variant: "check" };
    }
    return { label: "OK", variant: "ok" };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Clearance Tracker</h1>
          <p className="text-muted-foreground">Track PAR-Qs, clearance letters, and annual reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRow ? "Edit Client" : "Add Client to Tracker"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic info */}
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

              {/* Clearance section */}
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
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Auto-clearance triggered:</p>
                      <p>{detectedAuto.join(", ")}</p>
                      <p className="mt-1 text-xs">Clearance requirement set to Yes automatically.</p>
                    </div>
                  </div>
                )}
                {detectedCase.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Case-by-case assessment:</p>
                      <p>{detectedCase.join(", ")}</p>
                      <p className="mt-1 text-xs">Review severity before deciding on clearance.</p>
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
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingRow ? "Save Changes" : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Cleared / OK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{flagSummary.ok + flagSummary.na}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Chase</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{flagSummary.chase}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{flagSummary.check}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Search clients or conditions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterFlag} onValueChange={setFilterFlag}>
          <SelectTrigger className="w-40">
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
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No clients in tracker yet</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                return (
                  <TableRow key={row.id}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">
                      {row.client_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          flag.variant === "ok" || flag.variant === "na"
                            ? "default"
                            : flag.variant === "chase"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          flag.variant === "ok"
                            ? "bg-green-600"
                            : flag.variant === "na"
                            ? "bg-muted-foreground"
                            : flag.variant === "chase"
                            ? "bg-amber-600"
                            : "bg-orange-500"
                        }
                      >
                        {flag.variant === "ok" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {(flag.variant === "chase" || flag.variant === "check") && (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        )}
                        {flag.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.clearance_required === "Y" ? (
                        <span className="text-red-600 font-semibold">Yes</span>
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
                      <Badge variant="outline">{row.clearance_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.clearance_filed === "Y" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {row.parq_received_date ? format(parseISO(row.parq_received_date), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      {row.annual_review_due_date ? (
                        <span
                          className={
                            new Date(row.annual_review_due_date) < new Date()
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {format(parseISO(row.annual_review_due_date), "dd MMM yyyy")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.last_session_delivered
                        ? format(parseISO(row.last_session_delivered), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rules reminder */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Rules — Always Follow</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              Never deliver a session to a client with Chase or Check in the Flag column.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              Check the Flag column before booking or confirming any new session block.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              Update the tracker the same day you receive any PAR-Q or clearance letter.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              Set a calendar reminder for every annual review date so PAR-Qs never go out of date.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              If a client discloses a new condition between reviews, update their row immediately.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              Print or save each completed PAR-Q as a PDF and file alongside the signed contract.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
