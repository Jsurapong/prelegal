"use client";

import { useState } from "react";
import { NdaFormData, formatDate } from "@/lib/nda-types";

interface Props {
  data: NdaFormData;
}

export default function PdfDownloadButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const element = document.getElementById("nda-document");
      if (!element) throw new Error("Document element not found");

      // Capture at 2× for retina quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      // Paginate if content is taller than one page
      let yOffset = 0;
      let remaining = imgH;

      while (remaining > 0) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        remaining -= pageH;
      }

      // Filename: mutual-nda-PartyA-PartyB.pdf
      const p1 = (data.party1.company || "Party1").replace(/\s+/g, "-");
      const p2 = (data.party2.company || "Party2").replace(/\s+/g, "-");
      const dateStr = formatDate(data.effectiveDate).replace(/\s/g, "-").replace(",", "");
      pdf.save(`mutual-nda-${p1}-${p2}-${dateStr}.pdf`);
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
