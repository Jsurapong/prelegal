import {
  serializeNdaFields,
  mergeNdaFields,
  NdaFieldsPayload,
} from "@/lib/nda-fields-mapper";
import { createDefaultFormData, NdaFormData } from "@/lib/nda-types";

// ─── serializeNdaFields ──────────────────────────────────────────────────────

describe("serializeNdaFields", () => {
  it("converts nested NdaFormData to flat snake_case", () => {
    const data = createDefaultFormData();
    data.party1.company = "Acme Corp";
    data.governingLaw = "Delaware";

    const result = serializeNdaFields(data);

    expect(result.party1_company).toBe("Acme Corp");
    expect(result.governing_law).toBe("Delaware");
    expect(result.effective_date).toBeTruthy();
    expect(result.purpose).toBeTruthy();
  });

  it("returns null for empty string fields", () => {
    const data = createDefaultFormData();
    data.governingLaw = "";
    data.party1.company = "";

    const result = serializeNdaFields(data);

    expect(result.governing_law).toBeNull();
    expect(result.party1_company).toBeNull();
  });
});

// ─── mergeNdaFields ──────────────────────────────────────────────────────────

describe("mergeNdaFields", () => {
  let base: NdaFormData;

  beforeEach(() => {
    base = createDefaultFormData();
    base.party1.company = "Existing Co";
    base.governingLaw = "Texas";
  });

  it("overwrites fields when incoming has non-null values", () => {
    const incoming: NdaFieldsPayload = {
      governing_law: "Delaware",
      party1_company: "New Corp",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.governingLaw).toBe("Delaware");
    expect(result.party1.company).toBe("New Corp");
  });

  it("preserves existing values when incoming is null", () => {
    const incoming: NdaFieldsPayload = {
      governing_law: null,
      party1_company: null,
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.governingLaw).toBe("Texas");
    expect(result.party1.company).toBe("Existing Co");
  });

  it("preserves existing values when incoming is undefined", () => {
    const incoming: NdaFieldsPayload = {};

    const result = mergeNdaFields(base, incoming);

    expect(result.governingLaw).toBe("Texas");
    expect(result.party1.company).toBe("Existing Co");
  });

  it("preserves existing values when incoming is empty string", () => {
    const incoming: NdaFieldsPayload = {
      governing_law: "",
      party1_company: "",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.governingLaw).toBe("Texas");
    expect(result.party1.company).toBe("Existing Co");
  });

  it("maps all party1 fields correctly", () => {
    const incoming: NdaFieldsPayload = {
      party1_company: "Alpha LLC",
      party1_print_name: "Jane Doe",
      party1_title: "CEO",
      party1_notice_address: "jane@alpha.com",
      party1_date: "2025-06-01",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.party1.company).toBe("Alpha LLC");
    expect(result.party1.printName).toBe("Jane Doe");
    expect(result.party1.title).toBe("CEO");
    expect(result.party1.noticeAddress).toBe("jane@alpha.com");
    expect(result.party1.date).toBe("2025-06-01");
  });

  it("maps all party2 fields correctly", () => {
    const incoming: NdaFieldsPayload = {
      party2_company: "Beta Inc",
      party2_print_name: "John Smith",
      party2_title: "CTO",
      party2_notice_address: "john@beta.com",
      party2_date: "2025-07-15",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.party2.company).toBe("Beta Inc");
    expect(result.party2.printName).toBe("John Smith");
    expect(result.party2.title).toBe("CTO");
    expect(result.party2.noticeAddress).toBe("john@beta.com");
    expect(result.party2.date).toBe("2025-07-15");
  });

  it("maps enum fields correctly", () => {
    const incoming: NdaFieldsPayload = {
      mnda_term_type: "until_terminated",
      confidentiality_term_type: "perpetuity",
      mnda_term_years: "3",
      confidentiality_term_years: "5",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.mndaTermType).toBe("until_terminated");
    expect(result.confidentialityTermType).toBe("perpetuity");
    expect(result.mndaTermYears).toBe("3");
    expect(result.confidentialityTermYears).toBe("5");
  });

  it("maps snake_case to camelCase for all top-level fields", () => {
    const incoming: NdaFieldsPayload = {
      effective_date: "2026-01-01",
      mnda_term_type: "expires",
      mnda_term_years: "2",
      confidentiality_term_type: "expires",
      confidentiality_term_years: "3",
    };

    const result = mergeNdaFields(base, incoming);

    expect(result.effectiveDate).toBe("2026-01-01");
    expect(result.mndaTermType).toBe("expires");
    expect(result.mndaTermYears).toBe("2");
    expect(result.confidentialityTermType).toBe("expires");
    expect(result.confidentialityTermYears).toBe("3");
  });

  it("does not mutate the original data object", () => {
    const incoming: NdaFieldsPayload = { governing_law: "New York" };

    mergeNdaFields(base, incoming);

    expect(base.governingLaw).toBe("Texas");
  });
});
