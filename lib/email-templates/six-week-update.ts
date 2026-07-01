export interface SixWeekUpdateData {
  clientName: string;
  attendanceSection: string;
  highlightsSection: string;
  areasToDevelopSection: string;
  whatsNextSection: string;
  worthSayingSection: string;
}

export function buildSixWeekUpdateHtml(data: SixWeekUpdateData): string {
  const rose = "#C1839F";
  const teal = "#087E8B";
  const bodyColor = "#525A61";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your last 6 weeks with me</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:24px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <span style="font-size:28px;letter-spacing:2px;text-transform:uppercase;">🏋️</span>
              <h1 style="margin:12px 0 0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${teal};">YOUR LAST 6 WEEKS</h1>
              <h2 style="margin:4px 0 0;font-size:12px;font-weight:400;color:${bodyColor};letter-spacing:1px;text-transform:uppercase;">with me &mdash; Esther x</h2>
            </td>
          </tr>

          <tr><td style="height:1px;background-color:#E5E5E5;"></td></tr>

          <!-- Personal greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="font-size:16px;line-height:1.6;color:${bodyColor};margin:0 0 16px;">Hi ${data.clientName},</p>
              <p style="font-size:16px;line-height:1.6;color:${bodyColor};margin:0 0 16px;">Another six weeks done. I thought I'd write a short update on where we're at &mdash; the things that are going well, what I'm keeping an eye on, and what comes next for us in the studio.</p>
            </td>
          </tr>

          <!-- Section: Attendance & Consistency -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${rose};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${rose};margin:0;">Attendance &amp; Consistency</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${bodyColor};">
                ${data.attendanceSection}
              </div>
            </td>
          </tr>

          <!-- Section: Strength & Fitness Highlights -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${teal};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${teal};margin:0;">Strength &amp; Fitness Highlights</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${bodyColor};">
                ${data.highlightsSection}
              </div>
            </td>
          </tr>

          <!-- Section: Areas to Keep Developing -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${bodyColor};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${bodyColor};margin:0;">Areas to Keep Developing</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${bodyColor};">
                ${data.areasToDevelopSection}
              </div>
            </td>
          </tr>

          <!-- Section: What's Next for You -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${rose};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${rose};margin:0;">What's Next for You</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${bodyColor};">
                ${data.whatsNextSection}
              </div>
            </td>
          </tr>

          <!-- Section: Worth saying… -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:4px;height:28px;background-color:${teal};border-radius:2px;vertical-align:middle;"></td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <h3 style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${teal};margin:0;">Worth saying&hellip;</h3>
                  </td>
                </tr>
              </table>
              <div style="height:8px;"></div>
              <div style="font-size:15px;line-height:1.7;color:${bodyColor};">
                ${data.worthSayingSection}
              </div>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:32px 40px 40px;">
              <div style="border-top:1px solid #E5E5E5;padding-top:24px;">
                <p style="font-size:15px;line-height:1.6;color:${bodyColor};margin:0 0 4px;">Speak soon,</p>
                <p style="font-size:16px;line-height:1.6;color:#2D3436;margin:0;font-weight:500;">Esther x</p>
                <p style="font-size:12px;line-height:1.5;color:#7E8088;margin:12px 0 0;">
                  Esther Fair &middot; Level 4 Personal Trainer<br />
                  <span style="color:${rose};">Eternal Fitness</span> &middot; Worthing, West Sussex
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#F5F5F5;text-align:center;">
              <p style="font-size:11px;line-height:1.5;color:#7E8088;margin:0;">
                This email was sent to you because you're a client of Eternal Fitness.<br />
                If you'd rather not receive these updates, just let me know.
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
