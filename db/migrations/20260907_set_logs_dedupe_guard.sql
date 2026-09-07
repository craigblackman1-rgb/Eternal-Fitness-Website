-- BUG-EF-129 — dedup guard on (session_id, exercise_ref, set_number).
-- Prevents duplicate set-log rows even when the client sends different
-- client_op_ids for the same physical set (e.g. a re-tap race). The
-- partial unique index on client_op_id already catches identical-key
-- duplicates; this index catches the case where two different keys
-- target the same logical set.
--
-- ON CONFLICT DO NOTHING: an existing row for the same logical set is
-- treated as the canonical record. If the user actually needs to change
-- values on an already-logged set, they use PATCH (which updates by id).
--
-- Idempotent: safe to re-run. IF NOT EXISTS prevents duplicate index errors.

CREATE UNIQUE INDEX IF NOT EXISTS idx_set_logs_session_exercise_set
  ON set_logs(session_id, exercise_ref, set_number);
