"use client";

import dynamic from "next/dynamic";
import { GenericDocFields } from "@/lib/doc-types";
import { NdaFormData, createDefaultFormData } from "@/lib/nda-types";
import NdaPreview from "./NdaPreview";
import TemplateRenderer from "./TemplateRenderer";

const PdfDownloadButton = dynamic(() => import("./PdfDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="text-xs font-sans text-navy/40">Loading PDF...</span>
  ),
});

interface Props {
  documentType: string | null;
  fields: GenericDocFields;
}

/** Convert generic flat fields back to NdaFormData for the legacy NDA preview. */
function genericToNdaFormData(fields: GenericDocFields): NdaFormData {
  const defaults = createDefaultFormData();
  return {
    purpose: fields.purpose || defaults.purpose,
    effectiveDate: fields.effective_date || defaults.effectiveDate,
    mndaTermType:
      fields.mnda_term_type === "until_terminated"
        ? "until_terminated"
        : "expires",
    mndaTermYears: fields.mnda_term_years || defaults.mndaTermYears,
    confidentialityTermType:
      fields.confidentiality_term_type === "perpetuity"
        ? "perpetuity"
        : "expires",
    confidentialityTermYears:
      fields.confidentiality_term_years || defaults.confidentialityTermYears,
    governingLaw: fields.governing_law || "",
    jurisdiction: fields.jurisdiction || "",
    modifications: fields.modifications || "",
    party1: {
      company: fields.party1_company || "",
      printName: fields.party1_print_name || "",
      title: fields.party1_title || "",
      noticeAddress: fields.party1_notice_address || "",
      date: fields.party1_date || defaults.party1.date,
    },
    party2: {
      company: fields.party2_company || "",
      printName: fields.party2_print_name || "",
      title: fields.party2_title || "",
      noticeAddress: fields.party2_notice_address || "",
      date: fields.party2_date || defaults.party2.date,
    },
  };
}

export default function DocPreviewPanel({ documentType, fields }: Props) {
  // No document selected yet
  if (!documentType) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 border-b border-navy/10 bg-white/60 backdrop-blur-sm shrink-0">
          <span className="text-xs font-sans font-semibold tracking-widest uppercase text-navy/40">
            Document Preview
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-sans text-navy/50 leading-relaxed">
              Chat with the assistant to get started. Tell them what kind of legal
              document you need, and your document preview will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isNda = documentType === "mutual_nda";
  const elementId = isNda ? "nda-document" : "doc-preview-document";

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-navy/10 bg-white/60 backdrop-blur-sm shrink-0">
        <span className="text-xs font-sans font-semibold tracking-widest uppercase text-navy/40">
          Document Preview
        </span>
        <PdfDownloadButton
          elementId={elementId}
          documentType={documentType}
          fields={fields}
        />
      </div>

      {/* Scrollable document */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-navy/10 px-8 py-10 md:px-12 md:py-14">
          {isNda ? (
            <NdaPreview data={genericToNdaFormData(fields)} />
          ) : (
            <TemplateRenderer docId={documentType} fields={fields} />
          )}
        </div>
      </div>
    </div>
  );
}
