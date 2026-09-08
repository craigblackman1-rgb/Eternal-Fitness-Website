import { TriageScreen } from "./TriageScreen";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ScheduleTriagePage() {
  return <TriageScreen />;
}
