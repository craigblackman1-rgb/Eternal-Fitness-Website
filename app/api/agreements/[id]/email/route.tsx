import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { renderToBuffer } from "@react-pdf/renderer";
import { AgreementPDF } from "@/lib/agreement-pdf";
import { Resend } from "resend";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: agreement } = await supabase
    .from("signed_agreements")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  if (!agreement.client_email) {
    return NextResponse.json({ error: "No client email on file" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Email service not configured. Add RESEND_API_KEY to environment variables." },
      { status: 501 }
    );
  }

  try {
    const pdfDoc = <AgreementPDF agreement={agreement} />;
    const pdfBuffer = await renderToBuffer(pdfDoc);

    const resend = new Resend(resendApiKey);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Eternal Fitness <onboarding@resend.dev>",
      to: [agreement.client_email],
      subject: "Your Signed Personal Training Agreement — Eternal Fitness",
      html: `
        <p>Dear ${agreement.client_name},</p>
        <p>Thank you for signing your personal training agreement with Eternal Fitness.</p>
        <p>Please find your signed agreement attached to this email. A copy is also held securely on file.</p>
        <p>If you have any questions, please don't hesitate to get in touch.</p>
        <p>Kind regards,<br/>Esther Fair<br/>Eternal Fitness</p>
      `,
      attachments: [
        {
          filename: `Eternal-Fitness-Agreement-${agreement.client_name.replace(/\s+/g, "-")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
