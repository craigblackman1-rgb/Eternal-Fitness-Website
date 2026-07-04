const ROSE = "#C1839F";
const TEAL = "#087E8B";
const BODY_COLOR = "#525A61";

export interface EmailSection {
  label: string;
  color: string;
  html: string;
}

export interface BrandedUpdateEmailInput {
  documentTitle: string;
  emoji?: string;
  title: string;
  subtitle: string;
  greetingName: string;
  introHtml: string;
  sections: EmailSection[];
  footerNote?: string;
}

/**
 * Shared branded email chrome (header/footer/sign-off) for every client update
 * template kind — each kind only needs to supply its own section list.
 */
export function buildBrandedUpdateEmail(input: BrandedUpdateEmailInput): string {
  const footerNote = input.footerNote ?? "If you'd rather not receive these updates, just let me know.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${input.documentTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:24px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              ${input.emoji ? `<span style="font-size:28px;letter-spacing:2px;text-transform:uppercase;">${input.emoji}</span>` : ""}
              <h1 style="margin:12px 0 0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${TEAL};">${input.title}</h1>
              <h2 style="margin:4px 0 0;font-size:12px;font-weight:400;color:${BODY_COLOR};letter-spacing:1px;text-transform:uppercase;">${input.subtitle}</h2>
            </td>
          </tr>

          <tr><td style="height:1px;background-color:#E5E5E5;"></td></tr>

          <!-- Personal greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="font-size:16px;line-height:1.6;color:${BODY_COLOR};margin:0 0 16px;">Hi ${input.greetingName},</p>
              <div style="font-size:16px;line-height:1.6;color:${BODY_COLOR};margin:0 0 16px;">${input.introHtml}</div>
            </td>
          </tr>

          ${input.sections
            .map(
              (section) => `
          <!-- Section: ${section.label} -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${section.color};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${section.color};margin:0;">${section.label}</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${BODY_COLOR};">
                ${section.html}
              </div>
            </td>
          </tr>`,
            )
            .join("")}

          <!-- Sign-off -->
          <tr>
            <td style="padding:32px 40px 40px;">
              <div style="border-top:1px solid #E5E5E5;padding-top:24px;">
                <p style="font-size:15px;line-height:1.6;color:${BODY_COLOR};margin:0 0 4px;">Speak soon,</p>
                <p style="font-size:16px;line-height:1.6;color:#2D3436;margin:0;font-weight:500;">Esther x</p>
                <p style="font-size:12px;line-height:1.5;color:#7E8088;margin:12px 0 0;">
                  Esther Fair &middot; Level 4 Personal Trainer<br />
                  <span style="color:${ROSE};">Eternal Fitness</span> &middot; Worthing, West Sussex
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#F5F5F5;text-align:center;">
              <p style="font-size:11px;line-height:1.5;color:#7E8088;margin:0;">
                This email was sent to you because you're a client of Eternal Fitness.<br />
                ${footerNote}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
