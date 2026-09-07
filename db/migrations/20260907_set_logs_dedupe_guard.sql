-- BUG-EF-129 — dedup guard on (session_id, exercise_ref, set_number).
--
-- 1) Archive-then-remove existing duplicate rows (20 known on prod as of
--    2026-09-07), keeping the earliest row per logical set. Extras are copied
--    to set_logs_dedupe_archive_20260907 before deletion (DO-SOP-012).
-- 2) Unique index so two different client_op_ids can never target the same
--    logical set again. The partial unique index on client_op_id already
--    catches identical-key duplicates; this catches re-tap races that mint
--    fresh keys.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS set_logs_dedupe_archive_20260907
  (LIKE set_logs INCLUDING ALL);

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY session_id, exercise_ref, set_number
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM set_logs
),
extras AS (SELECT id FROM ranked WHERE rn > 1)
INSERT INTO set_logs_dedupe_archive_20260907
SELECT s.* FROM set_logs s JOIN extras e ON e.id = s.id
ON CONFLICT DO NOTHING;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY session_id, exercise_ref, set_number
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM set_logs
)
DELETE FROM set_logs WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_set_logs_session_exercise_set
  ON set_logs(session_id, exercise_ref, set_number);
