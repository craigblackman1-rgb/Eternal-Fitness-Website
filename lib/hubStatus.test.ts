import { describe, it, expect } from "vitest";
import {
  getStatusClasses,
  getBlockStatus,
  getComplianceStatus,
  lookupStatus,
} from "@/lib/hubStatus";

describe("getStatusClasses", () => {
  it("returns the class triple for each token", () => {
    expect(getStatusClasses("success")).toEqual({
      bg: "bg-[var(--status-success-bg)]",
      text: "text-[var(--status-success)]",
      border: "border-[var(--status-success-border)]",
    });
    expect(getStatusClasses("danger").text).toBe("text-[var(--status-danger)]");
    expect(getStatusClasses("neutral").bg).toBe("bg-[var(--status-neutral-bg)]");
  });
});

describe("getBlockStatus", () => {
  it("maps known block statuses to token and label", () => {
    expect(getBlockStatus("active")).toEqual({ token: "primary", label: "Active" });
    expect(getBlockStatus("approved")).toEqual({ token: "success", label: "Approved" });
    expect(getBlockStatus("draft")).toEqual({ token: "neutral", label: "Draft" });
  });

  it("returns null for an unknown block status", () => {
    expect(getBlockStatus("nope")).toBeNull();
  });
});

describe("getComplianceStatus", () => {
  it("maps each compliance status to its lookup", () => {
    expect(getComplianceStatus("do_not_train")).toEqual({ token: "danger", label: "Do Not Train" });
    expect(getComplianceStatus("pending_medical")).toEqual({ token: "warning", label: "Pending Clearance" });
    expect(getComplianceStatus("action_needed")).toEqual({ token: "warning", label: "Action Needed" });
    expect(getComplianceStatus("clear")).toEqual({ token: "success", label: "Clear" });
  });
});

describe("lookupStatus", () => {
  it("finds statuses across the block, compliance, document, and clearance maps", () => {
    expect(lookupStatus("active")).toEqual({ token: "primary", label: "Active" });
    expect(lookupStatus("do_not_train")).toEqual({ token: "danger", label: "Do Not Train" });
    expect(lookupStatus("signed")).toEqual({ token: "success", label: "Signed" });
    expect(lookupStatus("expired")).toEqual({ token: "danger", label: "Expired" });
    expect(lookupStatus("CLEARED")).toEqual({ token: "success", label: "Cleared" });
    expect(lookupStatus("NOT REQUIRED")).toEqual({ token: "neutral", label: "Not Required" });
  });

  it("returns null for an unrecognised status", () => {
    expect(lookupStatus("totally-unknown")).toBeNull();
  });

  it("prefers the block map when a key exists in multiple maps", () => {
    // "draft" exists in both blockStatusMap and documentStatusMap with the same value here,
    // but the block map is consulted first.
    expect(lookupStatus("draft")).toEqual({ token: "neutral", label: "Draft" });
  });
});
