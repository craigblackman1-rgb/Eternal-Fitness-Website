-- CR/BUG follow-up: distinguish Trainerize-derived programmes from hub-authored ones.
-- Esther reported Trainerize clones assigned to clients as confusing; they are being
-- unassigned back to the library and badged, ahead of fresh hub onboarding.
-- NO RLS / policies / authenticated role — plain Postgres.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'hub';

ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_source_check;
ALTER TABLE programs
  ADD CONSTRAINT programs_source_check CHECK (source IN ('hub', 'trainerize_import'));

CREATE INDEX IF NOT EXISTS idx_programs_source ON programs(source);

COMMENT ON COLUMN programs.source IS
  'Where the programme content came from: hub = authored in the programme builder; trainerize_import = cloned from the client''s Trainerize workouts.';
