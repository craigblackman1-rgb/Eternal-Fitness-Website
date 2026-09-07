/**
 * CR-EF-148: Extract emergency contact from PAR-Q structured fields and merge
 * into the client profile's `emergency_contact` object.
 *
 * The PAR-Q carries emergency_contact_name and emergency_contact_phone as
 * structured columns on signed_parq / client_documents (kind 'parq'). The
 * client profile stores a single emergency_contact { name, relationship, phone }.
 *
 * This module does NOT parse free text — the PAR-Q fields are already structured.
 * It handles two data paths:
 *   1. Direct PAR-Q fields (signed_parq table / api/parq route)
 *   2. Document-engine PAR-Q (feedback_responses.answers path)
 */

export interface EmergencyContact {
  name: string | null;
  relationship: string | null;
  phone: string | null;
  source?: string;
}

/**
 * Extract emergency contact fields from a PAR-Q record. Accepts either
 * the direct field shape (emergency_contact_name / emergency_contact_phone)
 * or the answers-wrapped shape from feedback_responses.answers.
 */
export function extractEmergencyContactFromParq(parqData: Record<string, unknown>): EmergencyContact | null {
  // Two data paths: direct fields (signed_parq / api/parq) or nested in
  // feedback_responses.answers (document-engine PAR-Q kind).
  const answers = parqData.feedback_responses && typeof parqData.feedback_responses === "object"
    ? (parqData.feedback_responses as Record<string, unknown>).answers as Record<string, unknown> | undefined
    : undefined;

  const name = (parqData.emergency_contact_name as string | null)
    ?? (answers?.emergency_contact_name as string | null)
    ?? null;
  const phone = (parqData.emergency_contact_phone as string | null)
    ?? (answers?.emergency_contact_phone as string | null)
    ?? null;

  if (!name?.trim() && !phone?.trim()) return null;

  return {
    name: name?.trim() || null,
    relationship: null, // PAR-Q does not collect this
    phone: phone?.trim() || null,
    source: "from PAR-Q",
  };
}

/**
 * Merge an incoming PAR-Q-sourced emergency contact into the existing profile
 * emergency_contact. Existing entries are never clobbered:
 *  - If PAR-Q has no data, existing is returned unchanged.
 *  - If PAR-Q has data, its name/phone overwrite; existing relationship is
 *    preserved when PAR-Q provides none (it always provides none).
 *  - source is set to "from PAR-Q" on the merged result.
 *  - An existing manually-entered entry (no source) is overwritten if the
 *    PAR-Q provides a non-null name or phone, since PAR-Q is the canonical
 *    clinical source for this data.
 *
 * Returns null if neither source has data, or the merged EmergencyContact.
 */
export function mergeEmergencyContact(
  existing: EmergencyContact | null | undefined,
  incoming: EmergencyContact | null,
): EmergencyContact | null {
  if (!incoming) return existing ?? null;
  if (!existing) return incoming;

  return {
    name: incoming.name || existing.name,
    relationship: incoming.relationship || existing.relationship,
    phone: incoming.phone || existing.phone,
    source: "from PAR-Q",
  };
}
