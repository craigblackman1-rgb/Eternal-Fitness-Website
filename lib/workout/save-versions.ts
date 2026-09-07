import type { Session, SessionVersion } from "@/types";

/**
 * Result of a versions-save attempt.
 */
export type SaveVersionsResult =
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Save edited session versions to the server.
 *
 * Shared by EditSheet (mobile editor, uses data_merge) and the desk
 * SessionEditor's parent page (uses full data replacement). The caller
 * provides the body shape; this function handles the fetch, error parsing,
 * and result mapping.
 *
 * @param sessionId - the session to PATCH
 * @param body - the JSON body to send (caller decides data_merge vs data)
 */
export async function saveSessionVersions(
  sessionId: string,
  body: Record<string, unknown>,
): Promise<SaveVersionsResult> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await res.json().then((b) => b?.error).catch(() => null);
    return { kind: "error", message: message || "Couldn't save changes" };
  }
  return { kind: "success" };
}

/**
 * Build the data_merge body for a versions-only patch.
 *
 * Used by EditSheet's mobile editor — touches only the versions field,
 * leaving session_log, exercise_notes, and everything else untouched.
 */
export function buildVersionsMergeBody(
  data: Session,
  version: string,
  sections: SessionVersion,
): Record<string, unknown> {
  const updatedData = {
    ...data,
    versions: { ...data.versions, [version]: sections },
  };
  return { data_merge: { versions: updatedData.versions } };
}

/**
 * Build the full-data body for a versions patch.
 *
 * Used by the desk SessionEditor's parent page — replaces the entire data
 * blob (slightly riskier but matches the existing implementation).
 */
export function buildVersionsFullBody(
  data: Session,
  version: string,
  sections: SessionVersion,
): Record<string, unknown> {
  const updatedData = {
    ...data,
    versions: { ...data.versions, [version]: sections },
  };
  return { data: updatedData };
}
