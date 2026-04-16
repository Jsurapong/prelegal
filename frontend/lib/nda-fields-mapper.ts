import { NdaFormData, MndaTermType, ConfidentialityTermType } from "./nda-types";

/**
 * Flat snake_case representation matching the backend NdaFields schema.
 * All values are nullable — only non-null values are merged.
 */
export interface NdaFieldsPayload {
  purpose?: string | null;
  effective_date?: string | null;
  mnda_term_type?: string | null;
  mnda_term_years?: string | null;
  confidentiality_term_type?: string | null;
  confidentiality_term_years?: string | null;
  governing_law?: string | null;
  jurisdiction?: string | null;
  modifications?: string | null;
  party1_company?: string | null;
  party1_print_name?: string | null;
  party1_title?: string | null;
  party1_notice_address?: string | null;
  party1_date?: string | null;
  party2_company?: string | null;
  party2_print_name?: string | null;
  party2_title?: string | null;
  party2_notice_address?: string | null;
  party2_date?: string | null;
}

/** Convert nested NdaFormData to flat snake_case for the backend. */
export function serializeNdaFields(data: NdaFormData): NdaFieldsPayload {
  return {
    purpose: data.purpose || null,
    effective_date: data.effectiveDate || null,
    mnda_term_type: data.mndaTermType || null,
    mnda_term_years: data.mndaTermYears || null,
    confidentiality_term_type: data.confidentialityTermType || null,
    confidentiality_term_years: data.confidentialityTermYears || null,
    governing_law: data.governingLaw || null,
    jurisdiction: data.jurisdiction || null,
    modifications: data.modifications || null,
    party1_company: data.party1.company || null,
    party1_print_name: data.party1.printName || null,
    party1_title: data.party1.title || null,
    party1_notice_address: data.party1.noticeAddress || null,
    party1_date: data.party1.date || null,
    party2_company: data.party2.company || null,
    party2_print_name: data.party2.printName || null,
    party2_title: data.party2.title || null,
    party2_notice_address: data.party2.noticeAddress || null,
    party2_date: data.party2.date || null,
  };
}

function pick(incoming: string | null | undefined, current: string): string {
  return incoming != null && incoming !== "" ? incoming : current;
}

const MNDA_TERM_TYPES: MndaTermType[] = ["expires", "until_terminated"];
const CONF_TERM_TYPES: ConfidentialityTermType[] = ["expires", "perpetuity"];

function pickEnum<T extends string>(incoming: string | null | undefined, current: T, allowed: T[]): T {
  if (incoming != null && incoming !== "" && allowed.includes(incoming as T)) {
    return incoming as T;
  }
  return current;
}

/** Merge non-null, non-empty incoming fields into the current NdaFormData. */
export function mergeNdaFields(
  current: NdaFormData,
  incoming: NdaFieldsPayload,
): NdaFormData {
  return {
    purpose: pick(incoming.purpose, current.purpose),
    effectiveDate: pick(incoming.effective_date, current.effectiveDate),
    mndaTermType: pickEnum(incoming.mnda_term_type, current.mndaTermType, MNDA_TERM_TYPES),
    mndaTermYears: pick(incoming.mnda_term_years, current.mndaTermYears),
    confidentialityTermType: pickEnum(incoming.confidentiality_term_type, current.confidentialityTermType, CONF_TERM_TYPES),
    confidentialityTermYears: pick(incoming.confidentiality_term_years, current.confidentialityTermYears),
    governingLaw: pick(incoming.governing_law, current.governingLaw),
    jurisdiction: pick(incoming.jurisdiction, current.jurisdiction),
    modifications: pick(incoming.modifications, current.modifications),
    party1: {
      company: pick(incoming.party1_company, current.party1.company),
      printName: pick(incoming.party1_print_name, current.party1.printName),
      title: pick(incoming.party1_title, current.party1.title),
      noticeAddress: pick(incoming.party1_notice_address, current.party1.noticeAddress),
      date: pick(incoming.party1_date, current.party1.date),
    },
    party2: {
      company: pick(incoming.party2_company, current.party2.company),
      printName: pick(incoming.party2_print_name, current.party2.printName),
      title: pick(incoming.party2_title, current.party2.title),
      noticeAddress: pick(incoming.party2_notice_address, current.party2.noticeAddress),
      date: pick(incoming.party2_date, current.party2.date),
    },
  };
}
