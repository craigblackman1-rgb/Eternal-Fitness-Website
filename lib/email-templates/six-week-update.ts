import { buildBrandedUpdateEmail } from "./shell";

const ROSE = "#C1839F";
const TEAL = "#087E8B";
const BODY_COLOR = "#525A61";

export interface SixWeekUpdateData {
  clientName: string;
  attendanceSection: string;
  bigWinSection: string;
  highlightsSection: string;
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
    introHtml: `<p style="margin:0;">I'd like to take a moment to look back over your last 6 weeks of training.</p>`,
    sections: [
      { label: "Attendance &amp; Consistency", color: ROSE, html: data.attendanceSection },
      { label: "The Big Win This Block", color: TEAL, html: data.bigWinSection },
      { label: "Strength &amp; Fitness Highlights", color: ROSE, html: data.highlightsSection },
      { label: "What's Next for You", color: TEAL, html: data.whatsNextSection },
      { label: "Worth Saying&hellip;", color: BODY_COLOR, html: data.worthSayingSection },
    ],
  });
}
