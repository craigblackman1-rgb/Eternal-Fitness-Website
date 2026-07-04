import { buildBrandedUpdateEmail } from "./shell";

const ROSE = "#C1839F";
const TEAL = "#087E8B";
const BODY_COLOR = "#525A61";

export interface SixWeekUpdateData {
  clientName: string;
  attendanceSection: string;
  highlightsSection: string;
  areasToDevelopSection: string;
  whatsNextSection: string;
  worthSayingSection: string;
}

export function buildSixWeekUpdateHtml(data: SixWeekUpdateData): string {
  return buildBrandedUpdateEmail({
    documentTitle: "Your last 6 weeks with me",
    previewText: "A short update on how the last six weeks have gone — and what's next.",
    title: "Your last 6 weeks",
    subtitle: "A training update from Esther",
    greetingName: data.clientName,
    introHtml: `<p style="margin:0;">Another six weeks done. I thought I'd write a short update on where we're at &mdash; the things that are going well, what I'm keeping an eye on, and what comes next for us in the studio.</p>`,
    sections: [
      { label: "Attendance &amp; Consistency", color: ROSE, html: data.attendanceSection },
      { label: "Strength &amp; Fitness Highlights", color: TEAL, html: data.highlightsSection },
      { label: "Areas to Keep Developing", color: BODY_COLOR, html: data.areasToDevelopSection },
      { label: "What's Next for You", color: ROSE, html: data.whatsNextSection },
      { label: "Worth saying&hellip;", color: TEAL, html: data.worthSayingSection },
    ],
  });
}
