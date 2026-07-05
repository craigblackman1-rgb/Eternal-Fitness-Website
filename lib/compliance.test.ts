import { describe, it, expect } from "vitest";
import { computeComplianceFlags } from "@/lib/compliance";
import type { DBClient, SignedAgreement, SignedPARQ } from "@/types";

type ClientArg = Pick<
  DBClient,
  "compliance_status" | "profile" | "gp_letter_status" | "annual_review_due_date"
>;

function makeClient(overrides: Partial<ClientArg> = {}): ClientArg {
  return {
    compliance_status: "clear",
    profile: {} as DBClient["profile"],
    gp_letter_status: "not_requested" as DBClient["gp_letter_status"],
    annual_review_due_date: null,
    ...overrides,
  };
}

function makeParq(overrides: Record<string, string> = {}): SignedPARQ {
  const base: Record<string, unknown> = {};
  for (let i = 1; i <= 29; i++) base[`q${i}`] = "no";
  return { ...base, ...overrides } as unknown as SignedPARQ;
}

const signedAgreement = { status: "signed" } as unknown as SignedAgreement;

describe("computeComplianceFlags", () => {
  it("is clear when a PAR-Q with no risk factors and a signed agreement are on file", () => {
    const result = computeComplianceFlags({
      client: makeClient(),
      latestParq: makeParq(),
      latestAgreement: signedAgreement,
    });
    expect(result.requiresGpClearance).toBe(false);
    expect(result.autoOutstanding).toEqual([]);
    expect(result.effectiveStatus).toBe("clear");
  });

  it("flags a missing PAR-Q and missing signed agreement", () => {
    const result = computeComplianceFlags({
      client: makeClient(),
      latestParq: null,
      latestAgreement: null,
    });
    expect(result.autoOutstanding).toContain("No PAR-Q on file");
    expect(result.autoOutstanding).toContain("No signed agreement on file");
    expect(result.effectiveStatus).toBe("action_needed");
  });

  it("treats an unsigned agreement as missing", () => {
    const result = computeComplianceFlags({
      client: makeClient(),
      latestParq: makeParq(),
      latestAgreement: { status: "sent" } as unknown as SignedAgreement,
    });
    expect(result.autoOutstanding).toContain("No signed agreement on file");
  });

  it("requires GP clearance when a high-risk question is answered yes", () => {
    const result = computeComplianceFlags({
      client: makeClient(),
      latestParq: makeParq({ q1: "yes" }),
      latestAgreement: signedAgreement,
    });
    expect(result.requiresGpClearance).toBe(true);
    expect(result.autoOutstanding).toContain("GP clearance required — not yet obtained");
    expect(result.effectiveStatus).toBe("pending_medical");
  });

  it("does not require GP clearance for a non-high-risk yes answer", () => {
    const result = computeComplianceFlags({
      client: makeClient(),
      latestParq: makeParq({ q3: "yes" }),
      latestAgreement: signedAgreement,
    });
    expect(result.requiresGpClearance).toBe(false);
    expect(result.effectiveStatus).toBe("clear");
  });

  it("clears GP clearance requirement once clearance is obtained via profile", () => {
    const result = computeComplianceFlags({
      client: makeClient({
        profile: { health: { gp_clearance: true } } as DBClient["profile"],
      }),
      latestParq: makeParq({ q14: "yes" }),
      latestAgreement: signedAgreement,
    });
    expect(result.requiresGpClearance).toBe(true);
    expect(result.autoOutstanding).not.toContain("GP clearance required — not yet obtained");
    expect(result.effectiveStatus).toBe("clear");
  });

  it("flags a requested GP letter awaiting return", () => {
    const result = computeComplianceFlags({
      client: makeClient({ gp_letter_status: "requested" as DBClient["gp_letter_status"] }),
      latestParq: makeParq(),
      latestAgreement: signedAgreement,
    });
    expect(result.autoOutstanding).toContain("GP letter requested — awaiting return");
    expect(result.effectiveStatus).toBe("action_needed");
  });

  it("flags an overdue annual review", () => {
    const result = computeComplianceFlags({
      client: makeClient({ annual_review_due_date: "2000-01-01" }),
      latestParq: makeParq(),
      latestAgreement: signedAgreement,
    });
    expect(result.autoOutstanding).toContain("Annual medical review is overdue");
  });

  it("does not flag a future annual review date", () => {
    const result = computeComplianceFlags({
      client: makeClient({ annual_review_due_date: "2999-01-01" }),
      latestParq: makeParq(),
      latestAgreement: signedAgreement,
    });
    expect(result.autoOutstanding).not.toContain("Annual medical review is overdue");
    expect(result.effectiveStatus).toBe("clear");
  });

  it("always reports do_not_train when the client is marked as such, regardless of other state", () => {
    const result = computeComplianceFlags({
      client: makeClient({ compliance_status: "do_not_train" }),
      latestParq: makeParq(),
      latestAgreement: signedAgreement,
    });
    expect(result.effectiveStatus).toBe("do_not_train");
  });
});
