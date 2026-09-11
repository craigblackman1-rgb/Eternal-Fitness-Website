-- Plan Agent conversations: persist server-side so they survive device switches
-- and are visible to staff. Idempotent — safe to run multiple times.

CREATE TABLE IF NOT EXISTS plan_agent_conversations (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  messages  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- History table: nothing is lost when a conversation is cleared.
CREATE TABLE IF NOT EXISTS plan_agent_conversation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_agent_conversation_log_client
  ON plan_agent_conversation_log(client_id, archived_at DESC);
