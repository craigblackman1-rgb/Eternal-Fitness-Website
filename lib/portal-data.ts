/**
 * Server-side data access for the client portal. This is the ONLY place portal
 * routes read client data, and every query is filtered by the authenticated
 * client_id. The portal cookie never grants access to the staff Postgres role's
 * anon policies — reads use the app's service-role pg pool (same as the document
 * engine's public links). Defense-in-depth: each method re-asserts client_id.
 */

import { createPgClient } from "@/lib/pg-client";

export interface PortalClient {
  id: string;
  name: string;
  email: string | null;
}

export interface PortalDocument {
  id: string;
  kind: string;
  title: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  client_signed_date: string | null;
  requires_client_signature: boolean;
  version: number;
}

export interface PortalUpdate {
  id: string;
  subject: string;
  block_number: number;
  sent_at: string | null;
  status: string;
  opened_at: string | null;
}

export class PortalDataClient {
  private clientId: string;
  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async getClient(): Promise<PortalClient | null> {
    const pg = createPgClient();
    const { data, error } = await pg
      .from("clients")
      .select("id, name, email")
      .eq("id", this.clientId)
      .single();
    if (error || !data) return null;
    return data as PortalClient;
  }

  /** Documents the client has signed (signed status). */
  async getSignedDocuments(): Promise<PortalDocument[]> {
    const pg = createPgClient();
    const { data } = await pg
      .from("client_documents")
      .select(
        "id, kind, title, status, sent_at, signed_at, client_signed_date, requires_client_signature, version",
      )
      .eq("client_id", this.clientId)
      .eq("status", "signed")
      .order("signed_at", { ascending: false });
    return (data ?? []) as PortalDocument[];
  }

  /**
   * Outstanding / unsigned documents: any document issued to the client that is
   * not yet signed (draft, sent, received, expired, needs_update, superseded).
   * Superseded documents are shown but clearly marked as no longer current.
   */
  async getOutstandingDocuments(): Promise<PortalDocument[]> {
    const pg = createPgClient();
    const { data } = await pg
      .from("client_documents")
      .select(
        "id, kind, title, status, sent_at, signed_at, client_signed_date, requires_client_signature, version",
      )
      .eq("client_id", this.clientId)
      .neq("status", "signed")
      .order("sent_at", { ascending: false });
    return (data ?? []) as PortalDocument[];
  }

  /** History of update emails sent to this client. */
  async getUpdateHistory(): Promise<PortalUpdate[]> {
    const pg = createPgClient();
    const { data } = await pg
      .from("sent_updates")
      .select("id, subject, block_number, sent_at, status, opened_at")
      .eq("client_id", this.clientId)
      .order("sent_at", { ascending: false });
    return (data ?? []) as PortalUpdate[];
  }
}

export function createPortalDataClient(clientId: string): PortalDataClient {
  return new PortalDataClient(clientId);
}
