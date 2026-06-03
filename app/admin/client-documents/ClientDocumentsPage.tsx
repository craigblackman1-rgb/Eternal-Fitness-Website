"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientDocumentsSummary, DocumentStatus, ClearanceStatus } from "@/types";
import { FileText, Eye, Edit, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DocumentEditor } from "@/components/DocumentEditor";

const statusColors: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  received: "bg-purple-100 text-purple-800",
  signed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  needs_update: "bg-yellow-100 text-yellow-800",
};

const clearanceStatusColors: Record<ClearanceStatus, string> = {
  CLEARED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  "NOT YET REQUESTED": "bg-gray-100 text-gray-800",
  "NOT REQUIRED": "bg-blue-100 text-blue-800",
};

function StatusBadge({ status, type }: { status: string | null; type: "document" | "clearance" }) {
  if (!status) return <Badge variant="outline">Not Started</Badge>;
  
  const colors = type === "document" ? statusColors : clearanceStatusColors;
  return (
    <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {status.replace(/_/g, " ").toUpperCase()}
    </Badge>
  );
}

export default function ClientDocumentsPage() {
  const [clients, setClients] = useState<ClientDocumentsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientDocumentsSummary | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDocumentType, setEditDocumentType] = useState<"agreement" | "parq" | "tracker">("agreement");
  const supabase = createClient();

  useEffect(() => {
    fetchClientDocuments();
  }, []);

  const fetchClientDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("client_documents_summary")
        .select("*")
        .order("client_name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching client documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (client: ClientDocumentsSummary) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const handleEdit = (client: ClientDocumentsSummary, type: "agreement" | "parq" | "tracker") => {
    setSelectedClient(client);
    setEditDocumentType(type);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Client Documents Dashboard
          </CardTitle>
          <CardDescription>
            View and manage all client agreements, PAR-Q forms, and medical clearance trackers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search clients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Agreement Status</TableHead>
                  <TableHead>PAR-Q Status</TableHead>
                  <TableHead>Clearance Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={client.agreement_status} type="document" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.parq_status} type="document" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.clearance_status} type="clearance" />
                    </TableCell>
                    <TableCell>
                      {client.last_updated
                        ? new Date(client.last_updated).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(client)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client, "agreement")}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClient?.client_name} - Documents
            </DialogTitle>
            <DialogDescription>
              View all documents and their status
            </DialogDescription>
          </DialogHeader>
          {selectedClient && <DocumentViewer client={selectedClient} />}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editDocumentType === "agreement" ? "Agreement" : editDocumentType === "parq" ? "PAR-Q" : "Medical Tracker"} - {selectedClient?.client_name}
            </DialogTitle>
            <DialogDescription>
              Make changes to the document (authenticated users only)
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <DocumentEditor
              client={selectedClient}
              documentType={editDocumentType}
              onSave={() => {
                fetchClientDocuments();
                setEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
