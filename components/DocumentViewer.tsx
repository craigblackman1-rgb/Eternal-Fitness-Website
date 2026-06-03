"use client";

import { ClientDocumentsSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, AlertCircle, FileText, Calendar } from "lucide-react";

interface DocumentViewerProps {
  client: ClientDocumentsSummary;
}

function StatusIcon({ status }: { status: string | null }) {
  if (!status) return <AlertCircle className="h-5 w-5 text-gray-400" />;
  
  switch (status) {
    case "signed":
    case "CLEARED":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "sent":
    case "PENDING":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "needs_update":
    case "expired":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-blue-600" />;
  }
}

function DateDisplay({ label, date }: { label: string; date: string | null }) {
  if (!date) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Calendar className="h-4 w-4" />
      <span>{label}:</span>
      <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
    </div>
  );
}

export function DocumentViewer({ client }: DocumentViewerProps) {
  return (
    <div className="space-y-6">
      {/* Agreement Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Personal Training Agreement
          </CardTitle>
          <CardDescription>
            Agreement status and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {client.agreement_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={client.agreement_status} />
                <Badge
                  className={
                    client.agreement_status === "signed"
                      ? "bg-green-100 text-green-800"
                      : client.agreement_status === "sent"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {client.agreement_status?.toUpperCase() || "DRAFT"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <DateDisplay label="Sent" date={client.agreement_sent_date} />
                <DateDisplay label="Received" date={client.agreement_received_date} />
                <DateDisplay label="Signed" date={client.agreement_signed_at} />
              </div>

              {client.agreement_requires_update && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Update Required</p>
                      {client.agreement_update_notes && (
                        <p className="text-sm text-yellow-700 mt-1">
                          {client.agreement_update_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No agreement on file</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* PAR-Q Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PAR-Q / Medical Health Screening
          </CardTitle>
          <CardDescription>
            PAR-Q form status and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {client.parq_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={client.parq_status} />
                <Badge
                  className={
                    client.parq_status === "signed"
                      ? "bg-green-100 text-green-800"
                      : client.parq_status === "received"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {client.parq_status?.toUpperCase() || "DRAFT"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <DateDisplay label="Sent" date={client.parq_sent_date} />
                <DateDisplay label="Received" date={client.parq_received_date} />
                <DateDisplay label="Signed" date={client.parq_signed_at} />
              </div>

              {client.parq_requires_update && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Update Required</p>
                      {client.parq_update_notes && (
                        <p className="text-sm text-yellow-700 mt-1">
                          {client.parq_update_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No PAR-Q form on file</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Medical Clearance Tracker Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Clearance Tracker
          </CardTitle>
          <CardDescription>
            Medical clearance status and review dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {client.tracker_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={client.clearance_status} />
                <Badge
                  className={
                    client.clearance_status === "CLEARED"
                      ? "bg-green-100 text-green-800"
                      : client.clearance_status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {client.clearance_status || "NOT SET"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateDisplay label="PAR-Q Received" date={client.tracker_parq_received} />
                <DateDisplay label="Contract Signed" date={client.contract_signed_date} />
                <DateDisplay label="Annual Review Due" date={client.annual_review_due_date} />
                <DateDisplay label="Last Session" date={client.last_session_delivered} />
              </div>

              {client.clearance_required && client.clearance_required !== "NA" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Clearance Required:</span>{" "}
                    {client.clearance_required === "Y" ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No medical tracker on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
