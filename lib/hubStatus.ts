import type { DBClientComplianceStatus } from "@/types";

export type StatusToken = "primary" | "success" | "warning" | "danger" | "neutral";

export interface StatusClasses {
  bg: string;
  text: string;
  border: string;
}

export interface StatusLookup {
  token: StatusToken;
  label: string;
}

const statusClassMap: Record<StatusToken, StatusClasses> = {
  primary: {
    bg: "bg-[var(--status-primary-bg)]",
    text: "text-[var(--status-primary)]",
    border: "border-[var(--status-primary-border)]",
  },
  success: {
    bg: "bg-[var(--status-success-bg)]",
    text: "text-[var(--status-success)]",
    border: "border-[var(--status-success-border)]",
  },
  warning: {
    bg: "bg-[var(--status-warning-bg)]",
    text: "text-[var(--status-warning)]",
    border: "border-[var(--status-warning-border)]",
  },
  danger: {
    bg: "bg-[var(--status-danger-bg)]",
    text: "text-[var(--status-danger)]",
    border: "border-[var(--status-danger-border)]",
  },
  neutral: {
    bg: "bg-[var(--status-neutral-bg)]",
    text: "text-[var(--status-neutral)]",
    border: "border-[var(--status-neutral-border)]",
  },
};

const blockStatusMap: Record<string, StatusLookup> = {
  draft:    { token: "neutral", label: "Draft" },
  active:   { token: "primary", label: "Active" },
  approved: { token: "success", label: "Approved" },
  complete: { token: "success", label: "Complete" },
};

const complianceStatusMap: Record<DBClientComplianceStatus, StatusLookup> = {
  do_not_train:    { token: "danger",  label: "Do Not Train" },
  pending_medical: { token: "warning", label: "Pending Clearance" },
  action_needed:   { token: "warning", label: "Action Needed" },
  clear:           { token: "success", label: "Clear" },
};

export function getStatusClasses(token: StatusToken): StatusClasses {
  return statusClassMap[token];
}

export function getBlockStatus(status: string): StatusLookup | null {
  return blockStatusMap[status] ?? null;
}

export function getComplianceStatus(status: DBClientComplianceStatus): StatusLookup {
  return complianceStatusMap[status];
}

export function lookupStatus(status: string): StatusLookup | null {
  return blockStatusMap[status] ?? complianceStatusMap[status as DBClientComplianceStatus] ?? null;
}
