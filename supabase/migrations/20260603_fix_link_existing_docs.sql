-- Fix: Link existing agreements and PAR-Q forms to clients by name match
-- Also add a short display code for each client

-- Add a short display code to clients (e.g., AM, AW, BP)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS display_code TEXT;

-- Generate display codes from initials
UPDATE clients 
SET display_code = UPPER(
  LEFT(name, 1) || 
  COALESCE(NULLIF(SPLIT_PART(name, ' ', 2), ''), '')
)
WHERE display_code IS NULL;

-- Make display codes unique where possible, add number suffix for duplicates
WITH duplicates AS (
  SELECT display_code, COUNT(*) as cnt
  FROM clients
  GROUP BY display_code
  HAVING COUNT(*) > 1
)
UPDATE clients c
SET display_code = c.display_code || '_' || ROW_NUMBER() OVER (
  PARTITION BY c.display_code 
  ORDER BY c.created_at
)::TEXT
FROM duplicates d
WHERE c.display_code = d.display_code;

CREATE INDEX IF NOT EXISTS idx_clients_display_code ON clients(display_code);

-- Link existing signed_agreements to clients by name match
UPDATE signed_agreements sa
SET client_id = c.id
FROM clients c
WHERE sa.client_name = c.name AND sa.client_id IS NULL;

-- Link existing signed_parq to clients by name match
UPDATE signed_parq sp
SET client_id = c.id
FROM clients c
WHERE sp.full_name = c.name AND sp.client_id IS NULL;

-- Link existing client_tracker to clients by name match
UPDATE client_tracker ct
SET client_id = c.id
FROM clients c
WHERE ct.client_name = c.name AND ct.client_id IS NULL;

-- Update status fields for existing records that have signatures
UPDATE signed_agreements
SET status = 'signed'
WHERE client_signature_data IS NOT NULL AND status = 'draft';

UPDATE signed_parq
SET status = 'signed'
WHERE client_signature_data IS NOT NULL AND status = 'draft';

-- Update the view to include display_code and count of documents
DROP VIEW IF EXISTS client_documents_summary;

CREATE VIEW client_documents_summary AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.display_code,
  
  -- Agreement data (latest)
  sa.id as agreement_id,
  sa.status as agreement_status,
  sa.sent_date as agreement_sent_date,
  sa.received_date as agreement_received_date,
  sa.signed_at as agreement_signed_at,
  sa.requires_update as agreement_requires_update,
  sa.update_notes as agreement_update_notes,
  
  -- PAR-Q data (latest)
  sp.id as parq_id,
  sp.status as parq_status,
  sp.sent_date as parq_sent_date,
  sp.received_date as parq_received_date,
  sp.signed_at as parq_signed_at,
  sp.requires_update as parq_requires_update,
  sp.update_notes as parq_update_notes,
  
  -- Medical clearance data
  ct.id as tracker_id,
  ct.clearance_status,
  ct.clearance_required,
  ct.parq_received_date as tracker_parq_received,
  ct.contract_signed_date,
  ct.annual_review_due_date,
  ct.last_session_delivered,
  ct.notes as tracker_notes,
  
  -- Latest document timestamps
  GREATEST(
    COALESCE(sa.created_at, '1970-01-01'::timestamptz),
    COALESCE(sp.created_at, '1970-01-01'::timestamptz),
    COALESCE(ct.updated_at, '1970-01-01'::timestamptz)
  ) as last_updated

FROM clients c
LEFT JOIN LATERAL (
  SELECT * FROM signed_agreements 
  WHERE client_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) sa ON true
LEFT JOIN LATERAL (
  SELECT * FROM signed_parq 
  WHERE client_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) sp ON true
LEFT JOIN client_tracker ct ON c.id = ct.client_id
ORDER BY c.name;
