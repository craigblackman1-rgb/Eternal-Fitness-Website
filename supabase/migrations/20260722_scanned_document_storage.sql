-- Scanned/paper document storage
-- Allows storing uploaded files (scans/photos of paper documents) against a
-- client. The binary data lives in a separate table so list queries on
-- client_documents stay light. Purely additive — no existing columns altered.

ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'generated'
  CHECK (source_type IN ('generated', 'scan'));
ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS source_file_name TEXT;
ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS source_file_mime TEXT;
ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS source_file_size INT;

CREATE TABLE IF NOT EXISTS client_document_files (
  document_id UUID PRIMARY KEY REFERENCES client_documents(id) ON DELETE CASCADE,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE client_document_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage document files" ON client_document_files
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
