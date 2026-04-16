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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export const DEFAULT_FORM_DATA: NdaFormData = {
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: today(),
  mndaTermType: "expires",
  mndaTermYears: "1",
  confidentialityTermType: "expires",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: { company: "", printName: "", title: "", noticeAddress: "", date: today() },
  party2: { company: "", printName: "", title: "", noticeAddress: "", date: today() },
};

export function formatDate(iso: string): string {
  if (!iso) return "_______________";
  const [y, m, d] = iso.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
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
