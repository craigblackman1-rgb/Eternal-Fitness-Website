// Brand tokens — mirror app/globals.css / EF_Brand_Guidelines
const ROSE = "#C1839F";
const TEAL = "#087E8B";
const NAVY = "#282B38";
const INK = "#3C3C3C";
const BODY_COLOR = "#525A61";
const OFF_WHITE = "#F5F5F5";
const HAIRLINE = "#E7E4E6";

export interface EmailSection {
  label: string;
  color: string;
  html: string;
}

export interface BrandedUpdateEmailInput {
  documentTitle: string;
  /** Hidden inbox preview line (Gmail/Apple show this after the subject). */
  previewText?: string;
  /** @deprecated Emoji is no longer rendered in the header — kept for call-site compatibility. */
  emoji?: string;
  title: string;
  subtitle: string;
  greetingName: string;
  introHtml: string;
  sections: EmailSection[];
  footerNote?: string;
}

/**
 * Shared branded email chrome for every client update template kind. Redesigned
 * to carry the eternal-fitness.co.uk front-end look: a dark-navy header band with
 * the EF monogram + wordmark, a rose accent rule, tinted section cards, and a
 * warm sign-off. Each template kind only supplies its own section list.
 *
 * Email-client constraints honoured: table layout, inline styles, web-safe
 * fallbacks (DM Sans → Helvetica/Arial), no SVG (Gmail strips it), border-radius
 * used decoratively so Outlook degrades to squares without breaking layout.
 */
export function buildBrandedUpdateEmail(input: BrandedUpdateEmailInput): string {
  const footerNote = input.footerNote ?? "If you'd rather not receive these updates, just let me know.";
  const preview = input.previewText ?? input.subtitle;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${input.documentTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:${OFF_WHITE};font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${OFF_WHITE};font-size:1px;line-height:1px;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${OFF_WHITE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(40,43,56,0.08);">

          <!-- Brand header (dark navy band) -->
          <tr>
            <td style="background-color:${NAVY};padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;width:52px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" height="48" align="center" valign="middle" style="width:48px;height:48px;background-color:${ROSE};border-radius:50%;color:#FFFFFF;font-size:18px;font-weight:700;letter-spacing:1px;text-align:center;font-family:'DM Sans',Helvetica,Arial,sans-serif;">EF</td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;padding-left:14px;">
                    <div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#FFFFFF;text-transform:uppercase;line-height:1;">Eternal</div>
                    <div style="font-size:11px;font-weight:500;letter-spacing:4px;color:${ROSE};text-transform:uppercase;line-height:1;margin-top:5px;">Fitness</div>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <div style="font-size:10px;font-weight:500;letter-spacing:1.5px;color:rgba(255,255,255,0.55);text-transform:uppercase;">Worthing &middot; West Sussex</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rose accent rule -->
          <tr><td style="height:3px;background-color:${ROSE};line-height:3px;font-size:0;">&nbsp;</td></tr>

          <!-- Title block -->
          <tr>
            <td style="padding:36px 40px 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;color:${INK};line-height:1.25;">${input.title}</h1>
              <p style="margin:8px 0 0;font-size:13px;font-weight:500;letter-spacing:1px;color:${TEAL};text-transform:uppercase;">${input.subtitle}</p>
            </td>
          </tr>

          <!-- Personal greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="font-size:16px;line-height:1.6;color:${INK};margin:0 0 14px;font-weight:600;">Hi ${input.greetingName},</p>
              <div style="font-size:15px;line-height:1.7;color:${BODY_COLOR};margin:0;">${input.introHtml}</div>
            </td>
          </tr>

          ${input.sections
            .map(
              (section) => `
          <!-- Section: ${section.label} -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${OFF_WHITE};border-radius:14px;">
                <tr>
                  <td style="width:4px;background-color:${section.color};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${section.color};margin:0 0 8px;">${section.label}</div>
                    <div style="font-size:15px;line-height:1.7;color:${BODY_COLOR};">
                      ${section.html}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`,
            )
            .join("")}

          <!-- Sign-off -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <div style="border-top:1px solid ${HAIRLINE};padding-top:22px;">
                <p style="font-size:15px;line-height:1.6;color:${BODY_COLOR};margin:0 0 4px;">Speak soon,</p>
                <p style="font-size:20px;line-height:1.4;color:${INK};margin:0;font-weight:600;font-style:italic;">Esther x</p>
                <p style="font-size:12px;line-height:1.6;color:#8A8790;margin:12px 0 0;">
                  <strong style="color:${INK};font-weight:600;">Esther Fair</strong> &middot; Level 4 Personal Trainer<br />
                  <span style="color:${ROSE};font-weight:600;">Eternal Fitness</span> &middot; Private studio, Worthing, West Sussex
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;background-color:${NAVY};text-align:center;">
              <p style="font-size:11px;line-height:1.6;color:rgba(255,255,255,0.55);margin:0;">
                Sent to you because you're a client of Eternal Fitness.<br />
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
