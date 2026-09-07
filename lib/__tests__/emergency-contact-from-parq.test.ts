import { describe, it, expect } from "vitest";
import { extractEmergencyContactFromParq, mergeEmergencyContact } from "../emergency-contact-from-parq";
import type { EmergencyContact } from "../emergency-contact-from-parq";

describe("extractEmergencyContactFromParq", () => {
  it("returns null for empty data", () => {
    expect(extractEmergencyContactFromParq({})).toBeNull();
  });

  it("returns null when both fields are empty strings", () => {
    expect(extractEmergencyContactFromParq({
      emergency_contact_name: "",
      emergency_contact_phone: "",
    })).toBeNull();
  });

  it("returns null when both fields are null", () => {
    expect(extractEmergencyContactFromParq({
      emergency_contact_name: null,
      emergency_contact_phone: null,
    })).toBeNull();
  });

  it("extracts name only", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: "Jane Smith",
      emergency_contact_phone: null,
    });
    expect(result).toEqual({
      name: "Jane Smith",
      relationship: null,
      phone: null,
      source: "from PAR-Q",
    });
  });

  it("extracts phone only", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: null,
      emergency_contact_phone: "07700 900123",
    });
    expect(result).toEqual({
      name: null,
      relationship: null,
      phone: "07700 900123",
      source: "from PAR-Q",
    });
  });

  it("extracts both fields", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: "Jane Smith",
      emergency_contact_phone: "07700 900123",
    });
    expect(result).toEqual({
      name: "Jane Smith",
      relationship: null,
      phone: "07700 900123",
      source: "from PAR-Q",
    });
  });

  it("trims whitespace from name and phone", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: "  Jane Smith  ",
      emergency_contact_phone: "  07700 900123  ",
    });
    expect(result?.name).toBe("Jane Smith");
    expect(result?.phone).toBe("07700 900123");
  });

  it("reads from feedback_responses.answers (document-engine path)", () => {
    const result = extractEmergencyContactFromParq({
      feedback_responses: {
        answers: {
          emergency_contact_name: "John Doe",
          emergency_contact_phone: "01903 555123",
        },
      },
    });
    expect(result).toEqual({
      name: "John Doe",
      relationship: null,
      phone: "01903 555123",
      source: "from PAR-Q",
    });
  });

  it("prefers top-level fields over nested answers", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: "Top Level",
      emergency_contact_phone: "111",
      feedback_responses: {
        answers: {
          emergency_contact_name: "Nested",
          emergency_contact_phone: "222",
        },
      },
    });
    expect(result?.name).toBe("Top Level");
    expect(result?.phone).toBe("111");
  });

  it("falls back to nested answers when top-level is null", () => {
    const result = extractEmergencyContactFromParq({
      emergency_contact_name: null,
      emergency_contact_phone: null,
      feedback_responses: {
        answers: {
          emergency_contact_name: "Fallback Name",
          emergency_contact_phone: "999",
        },
      },
    });
    expect(result?.name).toBe("Fallback Name");
    expect(result?.phone).toBe("999");
  });
});

describe("mergeEmergencyContact", () => {
  it("returns null when both are null", () => {
    expect(mergeEmergencyContact(null, null)).toBeNull();
  });

  it("returns incoming when existing is null", () => {
    const incoming: EmergencyContact = { name: "Jane", relationship: null, phone: "123", source: "from PAR-Q" };
    expect(mergeEmergencyContact(null, incoming)).toEqual(incoming);
  });

  it("returns existing when incoming is null", () => {
    const existing: EmergencyContact = { name: "Jane", relationship: "Mother", phone: "123" };
    expect(mergeEmergencyContact(existing, null)).toEqual(existing);
  });

  it("returns existing when incoming is undefined", () => {
    const existing: EmergencyContact = { name: "Jane", relationship: "Mother", phone: "123" };
    expect(mergeEmergencyContact(existing, undefined)).toEqual(existing);
  });

  it("overwrites name and phone from PAR-Q", () => {
    const existing: EmergencyContact = { name: "Old Name", relationship: "Sister", phone: "000" };
    const incoming: EmergencyContact = { name: "New Name", relationship: null, phone: "999", source: "from PAR-Q" };
    const result = mergeEmergencyContact(existing, incoming);
    expect(result).toEqual({
      name: "New Name",
      relationship: "Sister",
      phone: "999",
      source: "from PAR-Q",
    });
  });

  it("preserves existing relationship when PAR-Q provides none", () => {
    const existing: EmergencyContact = { name: "Jane", relationship: "Wife", phone: "123" };
    const incoming: EmergencyContact = { name: "Jane", relationship: null, phone: "456", source: "from PAR-Q" };
    const result = mergeEmergencyContact(existing, incoming);
    expect(result?.relationship).toBe("Wife");
  });

  it("falls back to existing name when PAR-Q name is null", () => {
    const existing: EmergencyContact = { name: "Existing Name", relationship: null, phone: "123" };
    const incoming: EmergencyContact = { name: null, relationship: null, phone: "456", source: "from PAR-Q" };
    const result = mergeEmergencyContact(existing, incoming);
    expect(result?.name).toBe("Existing Name");
    expect(result?.phone).toBe("456");
  });

  it("falls back to existing phone when PAR-Q phone is null", () => {
    const existing: EmergencyContact = { name: "Jane", relationship: null, phone: "111" };
    const incoming: EmergencyContact = { name: "Jane", relationship: null, phone: null, source: "from PAR-Q" };
    const result = mergeEmergencyContact(existing, incoming);
    expect(result?.phone).toBe("111");
  });

  it("does not mutate the existing object", () => {
    const existing: EmergencyContact = { name: "Jane", relationship: "Mother", phone: "123" };
    const incoming: EmergencyContact = { name: "New", relationship: null, phone: "456", source: "from PAR-Q" };
    mergeEmergencyContact(existing, incoming);
    expect(existing.name).toBe("Jane");
    expect(existing.phone).toBe("123");
  });
});
