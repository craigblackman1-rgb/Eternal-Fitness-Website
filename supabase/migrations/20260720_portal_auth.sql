-- ============================================================================
-- Lane D, unit 2 — Client Portal auth surface (MIGRATION ONLY, NOT RUN)
-- ----------------------------------------------------------------------------
-- Separate, isolated magic-link auth instance for the client portal (/portal/*).
-- Deliberately distinct from the staff/trainer auth (lib/auth.ts -> better-auth
-- "user"/"session" tables). This instance owns its own tables with a `portal_`
-- prefix and its own cookie, so the staff path is never touched or weakened.
--
-- HARD CONSTRAINT: this file is written but NOT executed. No database was
-- connected to, no migration was run. It is staged for Craig's explicit go-ahead.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- portal_accounts — one row per client portal identity, bound 1:1 to clients.id
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  -- null = enabled. Set to NOW() by staff to disable/revoke a compromised account.
  disabled_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_accounts_client_id ON portal_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_accounts_email ON portal_accounts(email);

-- ----------------------------------------------------------------------------
-- portal_sessions — session tokens for the client portal instance
-- (kept separate from the staff "session" table so the two never intersect)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- client meta preserved for audit; mirrors better-auth session shape
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_account_id ON portal_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(token);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_expires ON portal_sessions(expires_at);

-- ----------------------------------------------------------------------------
-- portal_magic_links — single-use, short-lived magic-link tokens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,   -- store a hash, never the raw token
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,               -- null = unused; set on verify (single-use)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_magic_links_account_id ON portal_magic_links(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_token_hash ON portal_magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_expires ON portal_magic_links(expires_at);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The portal never uses the anon/authenticated Postgres roles for client data.
-- All reads are mediated by service-role API routes that filter by the
-- authenticated client_id. These tables therefore get NO client-facing policies;
-- access is via the application's service-role connection only.
ALTER TABLE portal_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_magic_links ENABLE ROW LEVEL SECURITY;

-- No FOR CLIENT policies: the portal cookie/session is application-level, not a
-- Postgres role. Staff (authenticated role) may manage accounts from the hub.
DROP POLICY IF EXISTS "Staff manage portal_accounts"    ON portal_accounts;
DROP POLICY IF EXISTS "Staff manage portal_sessions"    ON portal_sessions;
DROP POLICY IF EXISTS "Staff manage portal_magic_links" ON portal_magic_links;

CREATE POLICY "Staff manage portal_accounts"
  ON portal_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage portal_sessions"
  ON portal_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage portal_magic_links"
  ON portal_magic_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
