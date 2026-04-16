"use client";

import { useRouter } from "next/navigation";
import NdaForm from "@/components/NdaForm";
import { NdaFormData } from "@/lib/nda-types";

export default function HomePage() {
  const router = useRouter();

  function handleSubmit(data: NdaFormData) {
    const encoded = encodeURIComponent(JSON.stringify(data));
    router.push(`/preview?data=${encoded}`);
  }

  return (
    <div className="min-h-screen bg-parchment-texture">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-brass-light font-serif text-sm font-bold leading-none">P</span>
            </div>
            <span className="font-sans font-semibold text-navy tracking-tight">
              Prelegal
            </span>
          </div>
          <span className="text-xs font-sans text-navy/40 tracking-widest uppercase">
            Mutual NDA Creator
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
        {/* Hero */}
        <div className="mb-12 animate-fade-in-up">
          <p className="text-xs font-sans font-semibold tracking-widest uppercase text-brass mb-3">
            Agreement Builder
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-navy leading-tight mb-4">
            Mutual Non-Disclosure
            <br />
            <span className="italic text-navy/70">Agreement</span>
          </h1>
          <div className="section-rule w-24 mb-5" />
          <p className="font-sans text-navy/60 text-sm leading-relaxed max-w-xl">
            Based on the{" "}
            <a
              href="https://commonpaper.com/standards/mutual-nda/1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline decoration-brass/50 underline-offset-2 hover:text-brass transition-colors"
            >
              Common Paper MNDA v1.0
            </a>
            . Fill in the details below, review the generated document, and download a ready-to-sign PDF.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10 animate-fade-in-up animate-delay-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
              <span className="text-white text-xs font-sans font-semibold">1</span>
            </div>
            <span className="text-xs font-sans font-semibold text-navy">Fill Details</span>
          </div>
          <div className="w-12 h-px bg-navy/20 mx-1" />
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-7 h-7 rounded-full border-2 border-navy/30 flex items-center justify-center">
              <span className="text-navy text-xs font-sans font-semibold">2</span>
            </div>
            <span className="text-xs font-sans font-medium text-navy">Preview & Download</span>
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-200">
          <NdaForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
