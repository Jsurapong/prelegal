export interface PartyInfo {
  company: string;
  printName: string;
  title: string;
  noticeAddress: string;
  date: string;
}

export type MndaTermType = "expires" | "until_terminated";
export type ConfidentialityTermType = "expires" | "perpetuity";

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: MndaTermType;
  mndaTermYears: string;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Returns a fresh NdaFormData with today's date — call at component mount time. */
export function createDefaultFormData(): NdaFormData {
  const t = new Date().toISOString().split("T")[0];
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: t,
    mndaTermType: "expires",
    mndaTermYears: "1",
    confidentialityTermType: "expires",
    confidentialityTermYears: "1",
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { company: "", printName: "", title: "", noticeAddress: "", date: t },
    party2: { company: "", printName: "", title: "", noticeAddress: "", date: t },
  };
}

export function formatDate(iso: string): string {
  if (!iso) return "_______________";
  const parts = iso.split("-");
  if (parts.length !== 3) return "_______________";
  const [y, m, d] = parts;
  const monthIndex = parseInt(m, 10) - 1;
  const dayNum = parseInt(d, 10);
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return "_______________";
  if (isNaN(dayNum)) return "_______________";
  return `${MONTHS[monthIndex]} ${dayNum}, ${y}`;
}

export function mndaTermText(data: NdaFormData): string {
  if (data.mndaTermType === "until_terminated") {
    return "Continues until terminated in accordance with the terms of the MNDA.";
  }
  return `Expires ${data.mndaTermYears} year(s) from Effective Date.`;
}

export function confidentialityTermText(data: NdaFormData): string {
  if (data.confidentialityTermType === "perpetuity") return "In perpetuity.";
  return `${data.confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`;
}
