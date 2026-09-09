-- Add open/click tracking columns to client_documents, mirroring sent_updates.
-- The Resend/SendGrid webhook handlers currently only write these columns for
-- sent_updates (entity.type === "update"). This migration lets them also write
-- to client_documents when entity.type === "document".

ALTER TABLE client_documents
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;
