"use client";

import { useState } from "react";
import { NdaFormData, formatDate } from "@/lib/nda-types";

// Module-level flag prevents two concurrent captures of the same DOM element
let isGenerating = false;

function sanitizeFilename(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

interface Props {
  data: NdaFormData;
}

export default function PdfDownloadButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (isGenerating) return;
    isGenerating = true;
    setLoading(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      // html2canvas is loaded automatically by jsPDF's html() plugin
      await import("html2canvas");

      const element = document.getElementById("nda-document");
      if (!element) throw new Error("#nda-document not found");

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      // A4 = 595 x 842 pt; 40 pt margins each side → content width 515 pt
      await new Promise<void>((resolve, reject) => {
        pdf.html(element, {
          callback: (doc) => {
            try {
              const p1 = sanitizeFilename(data.party1.company || "Party1");
              const p2 = sanitizeFilename(data.party2.company || "Party2");
              const ds = formatDate(data.effectiveDate)
                .replace(/,/g, "")
                .replace(/\s+/g, "-");
              doc.save(`mutual-nda-${p1}-${p2}-${ds}.pdf`);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          margin: [40, 40, 40, 40],
          // 'text' mode avoids splitting a text run across pages
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
      isGenerating = false;
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
          Generating…
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
