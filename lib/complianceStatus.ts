import type { DBClientComplianceStatus } from "@/types";

/**
 * Shared mapping of client compliance status -> badge styling and label.
 * Used by both the clients list page and the client detail page so the
 * two views never drift out of sync.
 */

export function getComplianceBadgeClass(status: DBClientComplianceStatus | null): string {
  switch (status) {
    case "do_not_train":
      return "bg-rose text-white rounded-full";
    case "pending_medical":
      return "bg-amber-100 text-amber-800 border border-amber-200 rounded-full";
    case "action_needed":
      return "bg-amber-100 text-amber-800 border border-amber-200 rounded-full";
    default:
      return "";
  }
}

export function getComplianceLabel(status: DBClientComplianceStatus | null): string | null {
  switch (status) {
    case "do_not_train":
      return "Do Not Train";
    case "pending_medical":
      return "Pending Clearance";
    case "action_needed":
      return "Action Needed";
    default:
      return null;
  }
}
