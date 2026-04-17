"use client";

import { useState } from "react";
import { GenericDocFields } from "@/lib/doc-types";

function sanitizeFilename(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

interface Props {
  elementId: string;
  documentType: string;
  fields: GenericDocFields;
}

export default function PdfDownloadButton({ elementId, documentType, fields }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      await import("html2canvas");

      const element = document.getElementById(elementId);
      if (!element) throw new Error(`#${elementId} not found`);

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      await new Promise<void>((resolve, reject) => {
        pdf.html(element, {
          callback: (doc) => {
            try {
              const docSlug = sanitizeFilename(documentType.replace(/_/g, "-"));
              // Try to find party names from common field patterns
              const party1 =
                sanitizeFilename(
                  fields.party1_company ||
                    fields.provider_company ||
                    fields.company_company ||
                    "Party1",
                );
              const party2 =
                sanitizeFilename(
                  fields.party2_company ||
                    fields.customer_company ||
                    fields.partner_company ||
                    "Party2",
                );
              doc.save(`${docSlug}-${party1}-${party2}.pdf`);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          margin: [40, 40, 40, 40],
          autoPaging: "text",
          x: 0,
          y: 0,
          width: 515,
          windowWidth: element.scrollWidth || 800,
        });
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="group flex items-center gap-2 px-5 py-2.5 bg-brass text-white font-sans text-sm font-medium rounded shadow-[0_2px_12px_rgba(181,130,26,0.35)] hover:bg-brass-light transition-all hover:shadow-[0_4px_18px_rgba(181,130,26,0.4)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}
