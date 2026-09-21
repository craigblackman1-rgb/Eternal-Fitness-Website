-- CR-EF-208 — Capture enquiry attribution (referrer, UTM, landing page).
--
-- Creates a `leads` table for the general lead-capture forms (contact page
-- form, consultation dialog) which previously only sent an email.  Adds the
-- same attribution columns to the existing `discovery_call_leads` table so
-- both flows record where the visitor came from.
--
-- No RLS — matches every other table on this plain-Postgres instance.

-- ─── General leads table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'contact_form',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  -- Attribution
  referrer TEXT NOT NULL DEFAULT '',
  landing_page TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_term TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

COMMENT ON TABLE leads IS
  'CR-EF-208 -- general enquiries from the public contact form and consultation dialog. Each row is a form submission with attribution data.';
COMMENT ON COLUMN leads.source IS
  'Which form produced this lead: contact_form or consultation_dialog.';
COMMENT ON COLUMN leads.referrer IS
  'document.referrer at time of submission — the page that linked the visitor here.';
COMMENT ON COLUMN leads.landing_page IS
  'Full URL the visitor landed on (window.location.href) — may differ from the page they are on now if they navigated after landing.';
COMMENT ON COLUMN leads.utm_source IS
  'utm_source query parameter captured on submission.';
COMMENT ON COLUMN leads.utm_medium IS
  'utm_medium query parameter captured on submission.';
COMMENT ON COLUMN leads.utm_campaign IS
  'utm_campaign query parameter captured on submission.';
COMMENT ON COLUMN leads.utm_term IS
  'utm_term query parameter captured on submission.';
COMMENT ON COLUMN leads.utm_content IS
  'utm_content query parameter captured on submission.';

-- ─── Attribution columns for discovery_call_leads ───────────────────────────

ALTER TABLE discovery_call_leads
  ADD COLUMN IF NOT EXISTS referrer TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS landing_page TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_source TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_medium TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_term TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_content TEXT NOT NULL DEFAULT '';
