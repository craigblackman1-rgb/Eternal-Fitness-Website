import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getPool } from "@/lib/pg-client";

/**
 * POST /api/clients/[id]/apply-program — set client.active_program_id
 *
 * If the programme belongs to another client (or is a library programme),
 * it is cloned into a new row owned by the target client so that editing
 * either client's plan does not affect the other. Re-applying your own
 * programme simply re-links it (no duplicate).
 */

function deriveCloneName(sourceName: string, targetFirstName: string): string {
  // "X — dates — title" or "X — title" → replace leading name segment
  const dash = sourceName.indexOf("—");
  if (dash !== -1) {
    return `${targetFirstName} —${sourceName.slice(dash + 1)}`;
  }
  return `${targetFirstName} — ${sourceName}`;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clientId } = params;
  const body = await request.json();
  const { program_id } = body;

  if (!program_id || typeof program_id !== "string") {
    return NextResponse.json({ error: "program_id is required" }, { status: 400 });
  }

  // Load programme including client_id
  const { data: program, error: progErr } = await supabase
    .from("programs")
    .select("id, client_id, name, notes, weeks")
    .eq("id", program_id)
    .single();

  if (progErr || !program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Verify client exists
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Own programme → re-link without cloning
  if (program.client_id === clientId) {
    const { error: updateErr } = await supabase
      .from("clients")
      .update({ active_program_id: program_id })
      .eq("id", clientId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, program_id, cloned: false });
  }

  // Another client's or library programme → clone transactionally
  const pool = getPool();
  const pg = await pool.connect();
  try {
    await pg.query("BEGIN");

    // Fetch source slots
    const slotsRes = await pg.query(
      `SELECT position, label, data FROM program_slots WHERE program_id = $1 ORDER BY position`,
      [program_id],
    );

    const targetFirstName = (client.name ?? "").split(/\s+/)[0] || "Client";
    const newName = deriveCloneName(program.name, targetFirstName);
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const cloneNote = `\nCloned from ${program.name} (${program_id}) on apply, ${today}.`;
    const notes = program.notes ? `${program.notes}\n${cloneNote}` : cloneNote.trim();

    // Insert cloned programme
    const newProgRes = await pg.query(
      `INSERT INTO programs (name, client_id, weeks, notes, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id`,
      [newName, clientId, program.weeks, notes],
    );
    const newProgramId: string = newProgRes.rows[0].id;

    // Copy slots
    for (const slot of slotsRes.rows) {
      await pg.query(
        `INSERT INTO program_slots (program_id, position, label, data)
         VALUES ($1, $2, $3, $4)`,
        [newProgramId, slot.position, slot.label, slot.data],
      );
    }

    // Point client at the new clone
    await pg.query(
      `UPDATE clients SET active_program_id = $1 WHERE id = $2`,
      [newProgramId, clientId],
    );

    await pg.query("COMMIT");

    return NextResponse.json({ ok: true, program_id: newProgramId, cloned: true });
  } catch (err) {
    await pg.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : "Clone failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    pg.release();
  }
}
