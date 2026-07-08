export type DocumentKind = "terms" | "risk_assessment" | "annual_review";

export type DocumentStatus = "draft" | "sent" | "signed" | "superseded";

export interface DocumentSection {
  id: string;
  title: string;
  html: string;
}

export interface DocumentBody {
  intro?: string;
  sections: DocumentSection[];
}

export interface DocumentTemplate {
  id: string;
  kind: DocumentKind;
  name: string;
  version: number;
  body: DocumentBody;
  requires_client_signature: boolean;
  requires_trainer_signature: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  kind: DocumentKind;
  title: string;
  template_id: string | null;
  template_version: number | null;
  body: DocumentBody;
  requires_client_signature: boolean;
  requires_trainer_signature: boolean;
  status: DocumentStatus;
  version: number;
  supersedes_id: string | null;
  client_name: string | null;
  client_signature: string | null;
  client_signed_date: string | null;
  trainer_name: string | null;
  trainer_signature: string | null;
  trainer_signed_date: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  terms: "Terms & Conditions",
  risk_assessment: "Risk Assessment",
  annual_review: "Annual Review",
};

/** Whether every required signature is present — used to decide "signed" status. */
export function isFullySigned(doc: Pick<ClientDocument, "requires_client_signature" | "requires_trainer_signature" | "client_signature" | "trainer_signature">): boolean {
  if (doc.requires_client_signature && !doc.client_signature) return false;
  if (doc.requires_trainer_signature && !doc.trainer_signature) return false;
  return true;
}
