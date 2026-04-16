import {
  formatDate,
  mndaTermText,
  confidentialityTermText,
  createDefaultFormData,
  NdaFormData,
} from "@/lib/nda-types";

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a standard ISO date correctly", () => {
    expect(formatDate("2024-04-15")).toBe("April 15, 2024");
  });

  it("formats January 1 correctly", () => {
    expect(formatDate("2024-01-01")).toBe("January 1, 2024");
  });

  it("formats December 31 correctly", () => {
    expect(formatDate("2024-12-31")).toBe("December 31, 2024");
  });

  it("formats a leap day correctly", () => {
    expect(formatDate("2024-02-29")).toBe("February 29, 2024");
  });

  it("formats all twelve months by index", () => {
    const expected = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    expected.forEach((month, i) => {
      const mm = String(i + 1).padStart(2, "0");
      expect(formatDate(`2024-${mm}-10`)).toBe(`${month} 10, 2024`);
    });
  });

  it("returns placeholder for empty string", () => {
    expect(formatDate("")).toBe("_______________");
  });

  it("returns placeholder for a string with no dashes", () => {
    expect(formatDate("20240415")).toBe("_______________");
  });

  it("returns placeholder for month 00 (invalid)", () => {
    expect(formatDate("2024-00-01")).toBe("_______________");
  });

  it("returns placeholder for month 13 (out of range)", () => {
    expect(formatDate("2024-13-01")).toBe("_______________");
  });

  it("returns placeholder for malformed day (non-numeric)", () => {
    expect(formatDate("2024-01-xx")).toBe("_______________");
  });

  it("returns placeholder for a partial ISO string", () => {
    expect(formatDate("2024-")).toBe("_______________");
  });

  it("strips leading zero from day", () => {
    expect(formatDate("2024-03-05")).toBe("March 5, 2024");
  });
});

// ─── mndaTermText ─────────────────────────────────────────────────────────────

function base(): NdaFormData {
  return createDefaultFormData();
}

describe("mndaTermText", () => {
  it('returns expires text when type is "expires"', () => {
    const data = { ...base(), mndaTermType: "expires" as const, mndaTermYears: "1" };
    expect(mndaTermText(data)).toBe("Expires 1 year(s) from Effective Date.");
  });

  it("includes the correct year count", () => {
    const data = { ...base(), mndaTermType: "expires" as const, mndaTermYears: "3" };
    expect(mndaTermText(data)).toBe("Expires 3 year(s) from Effective Date.");
  });

  it('returns until-terminated text when type is "until_terminated"', () => {
    const data = { ...base(), mndaTermType: "until_terminated" as const };
    expect(mndaTermText(data)).toBe(
      "Continues until terminated in accordance with the terms of the MNDA."
    );
  });

  it("ignores mndaTermYears when type is until_terminated", () => {
    const data = {
      ...base(),
      mndaTermType: "until_terminated" as const,
      mndaTermYears: "99",
    };
    expect(mndaTermText(data)).not.toContain("99");
  });
});

// ─── confidentialityTermText ──────────────────────────────────────────────────

describe("confidentialityTermText", () => {
  it('returns expires text when type is "expires"', () => {
    const data = {
      ...base(),
      confidentialityTermType: "expires" as const,
      confidentialityTermYears: "1",
    };
    expect(confidentialityTermText(data)).toContain("1 year(s) from Effective Date");
    expect(confidentialityTermText(data)).toContain("trade secrets");
  });

  it("includes the correct year count", () => {
    const data = {
      ...base(),
      confidentialityTermType: "expires" as const,
      confidentialityTermYears: "2",
    };
    expect(confidentialityTermText(data)).toContain("2 year(s)");
  });

  it('returns "In perpetuity." when type is "perpetuity"', () => {
    const data = { ...base(), confidentialityTermType: "perpetuity" as const };
    expect(confidentialityTermText(data)).toBe("In perpetuity.");
  });

  it("ignores confidentialityTermYears when type is perpetuity", () => {
    const data = {
      ...base(),
      confidentialityTermType: "perpetuity" as const,
      confidentialityTermYears: "50",
    };
    expect(confidentialityTermText(data)).not.toContain("50");
  });
});

// ─── createDefaultFormData ────────────────────────────────────────────────────

describe("createDefaultFormData", () => {
  it("returns a fresh object on each call", () => {
    const a = createDefaultFormData();
    const b = createDefaultFormData();
    expect(a).not.toBe(b);
    expect(a.party1).not.toBe(b.party1);
  });

  it("sets effectiveDate to today in YYYY-MM-DD format", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(createDefaultFormData().effectiveDate).toBe(today);
  });

  it("sets party signature dates to today", () => {
    const today = new Date().toISOString().split("T")[0];
    const data = createDefaultFormData();
    expect(data.party1.date).toBe(today);
    expect(data.party2.date).toBe(today);
  });

  it("defaults mndaTermType to expires", () => {
    expect(createDefaultFormData().mndaTermType).toBe("expires");
  });

  it("defaults mndaTermYears to 1", () => {
    expect(createDefaultFormData().mndaTermYears).toBe("1");
  });

  it("defaults confidentialityTermType to expires", () => {
    expect(createDefaultFormData().confidentialityTermType).toBe("expires");
  });

  it("has a non-empty purpose", () => {
    expect(createDefaultFormData().purpose.length).toBeGreaterThan(0);
  });

  it("starts with empty party fields", () => {
    const { party1, party2 } = createDefaultFormData();
    expect(party1.company).toBe("");
    expect(party1.printName).toBe("");
    expect(party2.company).toBe("");
  });
});
