"use client";

import dynamic from "next/dynamic";
import NdaPreview from "./NdaPreview";
import { NdaFormData } from "@/lib/nda-types";

const PdfDownloadButton = dynamic(() => import("./PdfDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="text-xs font-sans text-navy/40">Loading PDF…</span>
  ),
});

interface Props {
  data: NdaFormData;
}

export default function NdaPreviewPanel({ data }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-navy/10 bg-white/60 backdrop-blur-sm shrink-0">
        <span className="text-xs font-sans font-semibold tracking-widest uppercase text-navy/40">
          Document Preview
        </span>
        <PdfDownloadButton data={data} />
      </div>

      {/* Scrollable document */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-navy/10 px-8 py-10 md:px-12 md:py-14">
          <NdaPreview data={data} />
        </div>
      </div>
    </div>
  );
}
