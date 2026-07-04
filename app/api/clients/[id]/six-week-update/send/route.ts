import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getEmailSender } from "@/lib/email";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientNumber = parseInt(params.id);

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("client_number", clientNumber)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { subject, html, blockNumber, clientEmail, templateKind, skipSend, testRecipient } = await request.json();
  const resolvedSubject = subject || "Your last 6 weeks with me 🏋️";

  // Test send — fire the real email to Craig/Esther so they can eyeball it in a
  // real inbox. Deliberately NOT logged to sent_updates: it isn't a client send.
  if (testRecipient) {
    const sender = getEmailSender();
    try {
      const result = await sender.send({
        to: testRecipient,
        subject: `[TEST] ${resolvedSubject}`,
        html,
      });
      return NextResponse.json({ success: true, emailed: !result.dryRun, test: true });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to send test email" },
        { status: 500 },
      );
    }
  }

  // "Save without sending" — Esther delivered the update another way but still wants it logged.
  if (skipSend) {
    const { error: insertError } = await supabase.from("sent_updates").insert({
      client_id: client.id,
      subject: resolvedSubject,
      body_html: html,
      block_number: blockNumber || 0,
      template_kind: templateKind || "six_week_update",
      emailed: false,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailed: false });
  }

  if (!clientEmail) {
    return NextResponse.json({ error: "Client email address is required" }, { status: 400 });
  }

  // Remember the address on the client record so it prefills next time.
  // Best-effort: the email column may not exist yet on every environment.
  await supabase
    .from("clients")
    .update({ email: clientEmail })
    .eq("id", client.id)
    .then(undefined, () => {});

  const sender = getEmailSender();

  try {
    const result = await sender.send({
      to: clientEmail,
      subject: resolvedSubject,
      html,
    });

    // Still log it even on a dry run (SMTP unconfigured) — the history is the point,
    // not just send confirmation. `emailed` records whether it actually went out.
    const { error: insertError } = await supabase.from("sent_updates").insert({
      client_id: client.id,
      subject: resolvedSubject,
      body_html: html,
      block_number: blockNumber || 0,
      template_kind: templateKind || "six_week_update",
      emailed: !result.dryRun,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (result.dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        emailed: false,
        error: "SMTP is not configured — the email was NOT sent, but the update was logged. Set SMTP_HOST/PORT/USER/PASS/FROM to actually send.",
      });
    }

    return NextResponse.json({ success: true, emailed: true, messageId: result.messageId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
