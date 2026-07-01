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

  const { subject, html, blockNumber, clientEmail } = await request.json();

  if (!clientEmail) {
    return NextResponse.json({ error: "Client email address is required" }, { status: 400 });
  }

  const sender = getEmailSender();

  try {
    const result = await sender.send({
      to: clientEmail,
      subject: subject || "Your last 6 weeks with me 🏋️",
      html,
    });

    // SMTP not configured: nothing was actually sent, so don't record it as sent.
    if (result.dryRun) {
      return NextResponse.json({
        success: false,
        dryRun: true,
        error: "SMTP is not configured — the email was NOT sent. Set SMTP_HOST/PORT/USER/PASS/FROM in the environment.",
      });
    }

    const { error: insertError } = await supabase.from("sent_updates").insert({
      client_id: client.id,
      subject: subject || "Your last 6 weeks with me 🏋️",
      body_html: html,
      block_number: blockNumber || 0,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
