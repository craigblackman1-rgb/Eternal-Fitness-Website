import { createHmac, timingSafeEqual } from "crypto";

/**
 * Time-limited, tamper-proof PAR-Q edit links.
 *
 * A client-facing PAR-Q link carries the record id plus an expiry timestamp and
 * an HMAC over both. The link is valid for PARQ_LINK_TTL_DAYS; after that the
 * edit page shows an "expired" message and Esther re-sends to mint a fresh one.
 * No DB column needed — the signature is the capability, the expiry is baked in.
 *
 * Secret: PARQ_LINK_SECRET, falling back to CRON_SECRET (already set in Coolify).
 */
export const PARQ_LINK_TTL_DAYS = 7;
const TTL_MS = PARQ_LINK_TTL_DAYS * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.PARQ_LINK_SECRET || process.env.CRON_SECRET || "ef-parq-link-dev-secret";
}

function sign(id: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${id}.${exp}`).digest("hex").slice(0, 32);
}

/** Mint a fresh 7-day link's params for a PAR-Q id. */
export function mintParqLinkParams(id: string): { exp: number; sig: string } {
  const exp = Date.now() + TTL_MS;
  return { exp, sig: sign(id, exp) };
}

export interface ParqLinkCheck {
  ok: boolean;
  reason?: "expired" | "invalid";
}

/** Verify an edit link's expiry + signature. */
export function verifyParqLink(id: string, exp?: string | null, sig?: string | null): ParqLinkCheck {
  if (!exp || !sig) return { ok: false, reason: "invalid" };
  const expNum = Number(exp);
  if (!expNum || Number.isNaN(expNum)) return { ok: false, reason: "invalid" };

  const expected = sign(id, expNum);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "invalid" };

  if (Date.now() > expNum) return { ok: false, reason: "expired" };
  return { ok: true };
}
