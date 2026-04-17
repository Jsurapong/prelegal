"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { NdaFormData } from "@/lib/nda-types";
import { serializeNdaFields } from "@/lib/nda-fields-mapper";
import NdaPreview from "@/components/NdaPreview";

const PdfDownloadButton = dynamic(() => import("@/components/PdfDownloadButton"), {
  ssr: false,
  loading: () => (
    <button
      disabled
      className="flex items-center gap-2 px-5 py-2.5 bg-brass text-white rounded font-sans text-sm font-medium opacity-60 cursor-wait"
    >
      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      Preparing PDF...
    </button>
  ),
});

/** Convert NdaFormData to generic fields for PdfDownloadButton. */
function ndaToGenericFields(data: NdaFormData): Record<string, string> {
  const result: Record<string, string> = {};
  const serialized = serializeNdaFields(data);
  for (const [k, v] of Object.entries(serialized)) {
    if (v) result[k] = v;
  }
  return result;
}

function PreviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("data");

  if (!raw) {
    return (
      <div className="text-center py-24">
        <p className="font-sans text-navy/60 mb-4">No form data found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-navy underline font-sans text-sm"
        >
          Return to form
        </button>
      </div>
    );
  }

  let data: NdaFormData;
  try {
    data = JSON.parse(decodeURIComponent(raw));
  } catch {
    return (
      <div className="text-center py-24">
        <p className="font-sans text-red-600 mb-4">Could not parse form data.</p>
        <button
          onClick={() => router.push("/")}
          className="text-navy underline font-sans text-sm"
        >
          Return to form
        </button>
      </div>
    );
  }

  const genericFields = ndaToGenericFields(data);

  return (
    <div className="min-h-screen bg-parchment-texture">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-brass-light font-serif text-sm font-bold leading-none">P</span>
            </div>
            <span className="font-sans font-semibold text-navy tracking-tight">Prelegal</span>
          </div>

          <div className="flex items-center gap-3 no-pdf">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 px-4 py-2 text-navy/70 border border-navy/20 rounded font-sans text-sm hover:bg-navy/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Edit
            </button>
            <PdfDownloadButton
              elementId="nda-document"
              documentType="mutual_nda"
              fields={genericFields}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        {/* Status bar */}
        <div className="flex items-center gap-2 mb-8 no-pdf animate-fade-in-up">
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-7 h-7 rounded-full bg-navy/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-xs font-sans font-medium text-navy">Details filled</span>
          </div>
          <div className="w-12 h-px bg-navy/20 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
              <span className="text-white text-xs font-sans font-semibold">2</span>
            </div>
            <span className="text-xs font-sans font-semibold text-navy">Preview & Download</span>
          </div>
        </div>

        {/* Document card */}
        <div
          className="bg-white shadow-[0_2px_40px_rgba(21,39,74,0.08)] rounded-sm border border-navy/8 animate-fade-in-up animate-delay-100"
          style={{ borderColor: "rgba(21,39,74,0.08)" }}
        >
          <div className="px-10 py-12 md:px-16 md:py-16">
            <NdaPreview data={data} />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="mt-6 flex justify-end gap-3 no-pdf animate-fade-in-up animate-delay-200">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2.5 text-navy/70 border border-navy/20 rounded font-sans text-sm hover:bg-navy/5 transition-colors"
          >
            Edit Details
          </button>
          <PdfDownloadButton
            elementId="nda-document"
            documentType="mutual_nda"
            fields={genericFields}
          />
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-parchment-texture flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-navy/30 border-t-navy rounded-full animate-spin mx-auto mb-3" />
            <p className="font-sans text-navy/60 text-sm">Loading document...</p>
          </div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
