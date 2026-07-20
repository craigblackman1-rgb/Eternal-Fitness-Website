/**
 * Portal client auth — a SEPARATE, ISOLATED magic-link auth surface.
 *
 * This is intentionally NOT the same instance as the staff/trainer auth in
 * lib/auth.ts. It owns its own tables (portal_accounts / portal_sessions /
 * portal_magic_links, created in supabase/migrations/20260720_portal_auth.sql)
 * and its own cookie (better_auth_portal_session). The staff auth path,
 * middleware, and (protected) layout are never imported or modified here.
 *
 * Design contract (lane-d1-client-auth-design.md, approved 2026-07-20):
 *  - Passwordless magic-link only (no CAPTCHA, no puzzle 2FA).
 *  - Each account is bound 1:1 to a clients.id; a client sees only their own data.
 *  - Short-lived, single-use tokens; resend always available.
 *  - All data reads are server-filtered by the authenticated client_id.
 *
 * HARD CONSTRAINTS respected by this unit:
 *  - No migration is run; no database is connected to from this module at import.
 *  - No real email is sent unless SENDGRID/SMTP is configured; otherwise the
 *    link is surfaced only in the dry-run result (never auto-emitted to a client).
 */

import { randomBytes, createHash, randomUUID } from "crypto";
import { Pool } from "pg";

// --- isolated DB pool (separate from staff auth's pool) ---------------------
function portalPool(): Pool {
  const cs = process.env.DATABASE_URL;
  return new Pool({
    connectionString: cs,
    ssl: cs && !/127\.0\.0\.1|localhost/.test(cs) ? { rejectUnauthorized: false } : false,
    max: 5,
  });
}

// Magic-link lifetime: 15 minutes (design note: short, resend available).
const MAGIC_LINK_TTL_SECONDS = 15 * 60;
// Session lifetime: 7 days (design note: short-ish for read-only personal data).
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const PORTAL_COOKIE = "better_auth_portal_session";
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

export class PortalAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortalAuthError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PortalAccount {
  id: string;
  client_id: string;
  email: string;
  disabled_at: string | null;
  last_login_at: string | null;
}

/**
 * Resolve (and ensure existence of) a portal account for a client's email.
 * The account is created on first magic-link request if the email matches an
 * existing, enabled client row — but it is DISABLED by default until staff
 * enables it (invite flow is staff-gated, never auto-enabled for self-signup).
 */
async function findClientByEmail(email: string): Promise<{ client_id: string; name: string } | null> {
  const pool = portalPool();
  try {
    const res = await pool.query(
      `SELECT id, name FROM clients WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );
    const row = res.rows[0];
    return row ? { client_id: row.id, name: row.name } : null;
  } finally {
    await pool.end().catch(() => {});
  }
}

async function findPortalAccount(email: string): Promise<PortalAccount | null> {
  const pool = portalPool();
  try {
    const res = await pool.query(
      `SELECT id, client_id, email, disabled_at, last_login_at
         FROM portal_accounts WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );
    return res.rows[0] ?? null;
  } finally {
    await pool.end().catch(() => {});
  }
}

async function ensurePortalAccount(clientId: string, email: string): Promise<PortalAccount> {
  const pool = portalPool();
  try {
    const res = await pool.query(
      `INSERT INTO portal_accounts (client_id, email)
       VALUES ($1, $2)
       ON CONFLICT (client_id) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, client_id, email, disabled_at, last_login_at`,
      [clientId, email],
    );
    return res.rows[0];
  } finally {
    await pool.end().catch(() => {});
  }
}

export interface MagicLinkRequestResult {
  /** Always true so we never reveal whether an email is known (anti-enumeration). */
  requested: true;
  /** Present only in dry-run (no email backend) — the raw link for staging/review. */
  devLink?: string;
  dryRun?: boolean;
}

/**
 * Request a magic link. Returns success even if the email is unknown so the
 * response cannot be used to enumerate client accounts. The link is emailed via
 * getEmailSender() when a backend is configured; otherwise it is returned as a
 * devLink for staff review and NEVER sent to the client (Work Order rule).
 */
export async function requestPortalMagicLink(
  emailRaw: string,
  opts: { ipAddress?: string; userAgent?: string } = {},
): Promise<MagicLinkRequestResult> {
  const email = (emailRaw ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new PortalAuthError("A valid email address is required.");
  }

  const client = await findClientByEmail(email);
  if (!client) {
    // Unknown email — pretend success, send nothing.
    return { requested: true };
  }

  const account = await ensurePortalAccount(client.client_id, email);
  if (account.disabled_at) {
    // Disabled account — silently ignore (no enumeration signal).
    return { requested: true };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_SECONDS * 1000);

  const pool = portalPool();
  try {
    await pool.query(
      `INSERT INTO portal_magic_links (account_id, client_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [account.id, account.client_id, tokenHash, expiresAt],
    );
  } finally {
    await pool.end().catch(() => {});
  }

  const link = `${PORTAL_BASE_URL}/api/portal/auth/verify?token=${token}`;

  const { getEmailSender } = await import("@/lib/email");
  const sender = getEmailSender();
  const status = sender ? (await import("@/lib/email")).getEmailStatus() : null;
  const dryRun = !status || !status.configured;

  if (!dryRun) {
    await getEmailSender().send({
      to: email,
      subject: "Your Eternal Fitness portal sign-in link",
      html: `
        <p>Hi ${client.name},</p>
        <p>Click the link below to sign in to your Eternal Fitness client portal. This link expires in 15 minutes and can only be used once.</p>
        <p><a href="${link}">Sign in to your portal</a></p>
        <p>If you didn't request this, you can ignore this email. For security, never share this link.</p>
      `,
    });
  }

  // Never auto-emit to a real client when no backend exists; surface for review only.
  return { requested: true, devLink: dryRun ? link : undefined, dryRun };
}

export interface PortalSession {
  accountId: string;
  clientId: string;
  email: string;
}

/** Verify a magic-link token, consume it (single-use), and mint a session. */
export async function verifyPortalMagicLink(
  token: string,
  opts: { ipAddress?: string; userAgent?: string } = {},
): Promise<{ session: PortalSession; cookieValue: string }> {
  if (!token) throw new PortalAuthError("Missing sign-in token.");

  const tokenHash = hashToken(token);
  const pool = portalPool();
  try {
    const linkRes = await pool.query(
      `SELECT id, account_id, client_id, expires_at, used_at
         FROM portal_magic_links WHERE token_hash = $1 LIMIT 1`,
      [tokenHash],
    );
    const link = linkRes.rows[0];
    if (!link) throw new PortalAuthError("This sign-in link is invalid.");
    if (link.used_at) throw new PortalAuthError("This sign-in link has already been used.");
    if (new Date(link.expires_at).getTime() < Date.now()) {
      throw new PortalAuthError("This sign-in link has expired. Please request a new one.");
    }

    const acctRes = await pool.query(
      `SELECT id, client_id, email, disabled_at FROM portal_accounts WHERE id = $1 LIMIT 1`,
      [link.account_id],
    );
    const account = acctRes.rows[0];
    if (!account) throw new PortalAuthError("This sign-in link is invalid.");
    if (account.disabled_at) throw new PortalAuthError("This account has been disabled. Contact Eternal Fitness.");

    // Consume the magic link atomically.
    await pool.query(`UPDATE portal_magic_links SET used_at = NOW() WHERE id = $1`, [link.id]);

    // Mint a session.
    const sessionToken = randomBytes(32).toString("hex");
    const sessionExpires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
    await pool.query(
      `INSERT INTO portal_sessions (account_id, client_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [account.id, account.client_id, sessionToken, sessionExpires, opts.ipAddress ?? null, opts.userAgent ?? null],
    );
    await pool.query(`UPDATE portal_accounts SET last_login_at = NOW() WHERE id = $1`, [account.id]);

    return {
      session: { accountId: account.id, clientId: account.client_id, email: account.email },
      cookieValue: sessionToken,
    };
  } finally {
    await pool.end().catch(() => {});
  }
}

/** Resolve a session from a raw cookie token; returns null if invalid/expired. */
export async function getPortalSession(token: string | undefined): Promise<PortalSession | null> {
  if (!token) return null;
  const pool = portalPool();
  try {
    const res = await pool.query(
      `SELECT s.account_id, s.client_id, a.email, a.disabled_at
         FROM portal_sessions s
         JOIN portal_accounts a ON a.id = s.account_id
        WHERE s.token = $1 AND s.expires_at > NOW()
        LIMIT 1`,
      [token],
    );
    const row = res.rows[0];
    if (!row) return null;
    if (row.disabled_at) return null;
    return { accountId: row.account_id, clientId: row.client_id, email: row.email };
  } finally {
    await pool.end().catch(() => {});
  }
}

/** Destroy a session (client logout). */
export async function destroyPortalSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const pool = portalPool();
  try {
    await pool.query(`DELETE FROM portal_sessions WHERE token = $1`, [token]);
  } finally {
    await pool.end().catch(() => {});
  }
}

export const PORTAL_SESSION_COOKIE = PORTAL_COOKIE;
export const PORTAL_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
export { randomUUID };
