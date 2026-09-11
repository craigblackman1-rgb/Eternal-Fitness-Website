import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getPool } from "@/lib/pg-client";

/**
 * GET /api/clients/[id]/plan-agent-conversation
 * Returns { messages } for the given client (empty array if none).
 *
 * PUT /api/clients/[id]/plan-agent-conversation
 * Body: { messages } — upserts the conversation, sets updated_at = now().
 *
 * DELETE /api/clients/[id]/plan-agent-conversation
 * Archives the current conversation to the log, then deletes it. Returns 204.
 */

async function resolveClientId(clientNumber: string): Promise<string | null> {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("client_number", parseInt(clientNumber))
    .single();
  return client?.id ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await resolveClientId(params.id);
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT messages FROM plan_agent_conversations WHERE client_id = $1`,
    [clientId],
  );

  const messages = rows[0]?.messages ?? [];
  return NextResponse.json({ messages });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await resolveClientId(params.id);
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json();
  const { messages } = body;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO plan_agent_conversations (client_id, messages, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (client_id) DO UPDATE SET messages = $2, updated_at = now()`,
    [clientId, JSON.stringify(messages)],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await resolveClientId(params.id);
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const pool = getPool();
  const pg = await pool.connect();
  try {
    await pg.query("BEGIN");

    // Archive current conversation to the log
    await pg.query(
      `INSERT INTO plan_agent_conversation_log (client_id, messages)
       SELECT client_id, messages FROM plan_agent_conversations WHERE client_id = $1`,
      [clientId],
    );

    // Delete the active conversation
    await pg.query(
      `DELETE FROM plan_agent_conversations WHERE client_id = $1`,
      [clientId],
    );

    await pg.query("COMMIT");
  } catch (err) {
    await pg.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    pg.release();
  }

  return new NextResponse(null, { status: 204 });
}
