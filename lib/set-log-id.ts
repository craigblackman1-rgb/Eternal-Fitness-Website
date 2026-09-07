/**
 * BUG-EF-129 — deterministic UUID v5-like idempotency key for a set-log
 * operation. Derives from (sessionId, exerciseRef, setNumber) using the
 * Web Crypto API so the same logical set always produces the same
 * client_op_id, regardless of how many times the user taps Done or the
 * component re-renders.
 */
export async function stableSetOpId(
  sessionId: string,
  exerciseRef: string,
  setNumber: number,
): Promise<string> {
  const NS = "ef-set-log-v1";
  const input = new TextEncoder().encode(`${NS}:${sessionId}:${exerciseRef}:${setNumber}`);
  const hash = await crypto.subtle.digest("SHA-256", input);
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
