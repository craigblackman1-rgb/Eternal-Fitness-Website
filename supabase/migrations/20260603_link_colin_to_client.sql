-- Fix: Create client record for Colin Farley and link existing documents
-- Run this if the original migration was already applied without a client record

-- Step 1: Create client record (skip if already exists)
INSERT INTO clients (name, age, gender, profile, client_number)
SELECT
  'Colin Wesley Farley',
  65,
  'Male',
  '{}'::jsonb,
  COALESCE((SELECT MAX(client_number) FROM clients), 0) + 1
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Colin Wesley Farley');

-- Step 2: Link existing signed_parq record to client
UPDATE signed_parq
SET client_id = (SELECT id FROM clients WHERE name = 'Colin Wesley Farley')
WHERE full_name = 'Colin Wesley Farley' AND client_id IS NULL;

-- Step 3: Link existing signed_agreements record to client
UPDATE signed_agreements
SET client_id = (SELECT id FROM clients WHERE name = 'Colin Wesley Farley')
WHERE client_name = 'Colin Wesley Farley' AND client_id IS NULL;
