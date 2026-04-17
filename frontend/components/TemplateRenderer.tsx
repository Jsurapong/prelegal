"use client";

import { useEffect, useMemo, useState } from "react";
import { GenericDocFields } from "@/lib/doc-types";

interface Props {
  docId: string;
  fields: GenericDocFields;
}

/** Normalize span text to a snake_case field key for lookup. */
function spanToFieldKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function FilledValue({ children }: { children: React.ReactNode }) {
  return <em className="not-italic font-medium text-navy">{children}</em>;
}

function EmptyPlaceholder({ hint }: { hint: string }) {
  return (
    <span className="text-navy/30 border-b border-dashed border-navy/20 px-0.5">
      {hint || "_______________"}
    </span>
  );
}

/**
 * Parse template markdown and interpolate field values.
 * Returns an array of React nodes ready to render.
 */
function parseTemplate(
  markdown: string,
  fields: GenericDocFields,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = markdown.split("\n");
  let nodeKey = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith("# ")) {
      const k = nodeKey++;
      nodes.push(
        <h1
          key={k}
          className="font-serif text-2xl text-navy font-normal tracking-tight text-center mt-8 mb-4"
        >
          {interpolateSpans(trimmed.slice(2), fields, k)}
        </h1>,
      );
      continue;
    }

    // Section headers (numbered with header_2 spans)
    const header2Match = trimmed.match(
      /^\d+\.\s*<span\s+class="header_2"[^>]*>(.+?)<\/span>$/,
    );
    if (header2Match) {
      const sectionNum = trimmed.match(/^(\d+)\./)?.[1] ?? "";
      nodes.push(
        <div key={nodeKey++} className="mt-8 mb-5">
          <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-navy/40 mb-1">
            {sectionNum}. {header2Match[1]}
          </p>
          <div className="h-px bg-gradient-to-r from-navy/30 via-brass/30 to-transparent" />
        </div>,
      );
      continue;
    }

    // Sub-section headers (numbered with header_3 spans)
    const header3Match = trimmed.match(
      /^\d+\.\s*<span\s+class="header_3"[^>]*>(.+?)<\/span>\s*(.*)/,
    );
    if (header3Match) {
      const sectionNum = trimmed.match(/^(\d[\d.]*)\./)?.[1] ?? "";
      const title = header3Match[1];
      const rest = header3Match[2] || "";
      const k = nodeKey++;
      nodes.push(
        <p
          key={k}
          className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-4 text-justify"
        >
          <span className="font-bold">
            {sectionNum}. {title}
          </span>{" "}
          {rest && interpolateSpans(rest, fields, k)}
        </p>,
      );
      continue;
    }

    // Lettered sub-items (a. b. c. etc.)
    const letterMatch = trimmed.match(/^([a-z])\.\s+(.*)/);
    if (letterMatch) {
      const k = nodeKey++;
      nodes.push(
        <p
          key={k}
          className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-3 ml-8 text-justify"
        >
          <span className="font-medium">{letterMatch[1]}.</span>{" "}
          {interpolateSpans(letterMatch[2], fields, k)}
        </p>,
      );
      continue;
    }

    // Roman numeral sub-items (i. ii. iii. etc.)
    const romanMatch = trimmed.match(/^(i{1,3}|iv|vi{0,3})\.\s+(.*)/);
    if (romanMatch) {
      const k = nodeKey++;
      nodes.push(
        <p
          key={k}
          className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-2 ml-16 text-justify"
        >
          <span className="font-medium">{romanMatch[1]}.</span>{" "}
          {interpolateSpans(romanMatch[2], fields, k)}
        </p>,
      );
      continue;
    }

    // Definition items (bold terms)
    const defMatch = trimmed.match(/^\d+\.\s+\*\*"(.+?)"\*\*\s+(.*)/);
    if (defMatch) {
      const k = nodeKey++;
      nodes.push(
        <p
          key={k}
          className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-3 ml-4 text-justify"
        >
          <span className="font-bold">&ldquo;{defMatch[1]}&rdquo;</span>{" "}
          {interpolateSpans(defMatch[2], fields, k)}
        </p>,
      );
      continue;
    }

    // Default: regular paragraph with span interpolation
    const k = nodeKey++;
    nodes.push(
      <p
        key={k}
        className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-4 text-justify"
      >
        {interpolateSpans(trimmed, fields, k)}
      </p>,
    );
  }

  return nodes;
}

/**
 * Within a single line of text, find all <span class="*_link"> elements
 * and replace them with interpolated field values or the original text.
 */
function interpolateSpans(
  text: string,
  fields: GenericDocFields,
  baseKey: number,
): React.ReactNode[] {
  const spanPattern =
    /<span\s+class="(?:keyterms_link|coverpage_link|orderform_link|businessterms_link)"[^>]*>([^<]*)<\/span>/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partKey = 0;

  while ((match = spanPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleanHtml(text.slice(lastIndex, match.index), baseKey + partKey++));
    }

    const spanContent = match[1];
    const fieldKey = spanToFieldKey(spanContent);
    const value = fields[fieldKey];

    if (value) {
      parts.push(
        <FilledValue key={`f-${baseKey}-${partKey++}`}>{value}</FilledValue>,
      );
    } else {
      parts.push(
        <span key={`s-${baseKey}-${partKey++}`} className="font-semibold text-navy">
          {spanContent}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(cleanHtml(text.slice(lastIndex), baseKey + partKey++));
  }

  return parts;
}

/** Light cleanup of remaining HTML and markdown formatting in plain-text segments. */
function cleanHtml(text: string, key: number): React.ReactNode {
  const cleaned = text.replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "");
  const boldParts = cleaned.split(/\*\*(.+?)\*\*/g);
  if (boldParts.length > 1) {
    return (
      <span key={`c-${key}`}>
        {boldParts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i}>{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    );
  }
  return <span key={`c-${key}`}>{cleaned}</span>;
}

// ── Cover Page section ──────────────────────────────────────────────────────

function CoverField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6">
      <div className="sm:w-48 flex-shrink-0 mb-1 sm:mb-0 pt-0.5">
        <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-navy/50">
          {label}
        </p>
      </div>
      <div className="flex-1 text-sm font-serif text-navy leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CoverPageSection({ fields }: { fields: GenericDocFields }) {
  const entries = Object.entries(fields).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <>
      <div className="mt-8 mb-5">
        <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-navy/40 mb-1">
          Cover Page / Key Terms
        </p>
        <div className="h-px bg-gradient-to-r from-navy/30 via-brass/30 to-transparent" />
      </div>
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <CoverField key={key} label={formatFieldLabel(key)}>
            {value || <EmptyPlaceholder hint="" />}
          </CoverField>
        ))}
      </div>
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TemplateRenderer({ docId, fields }: Props) {
  const [templateMarkdown, setTemplateMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTemplateMarkdown(null);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiUrl}/api/templates/${docId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load template (${res.status})`);
        return res.text();
      })
      .then(setTemplateMarkdown)
      .catch((err) => setError(err.message));
  }, [docId]);

  const renderedTemplate = useMemo(() => {
    if (!templateMarkdown) return null;
    return parseTemplate(templateMarkdown, fields);
  }, [templateMarkdown, fields]);

  if (error) {
    return (
      <div className="text-center py-12 text-navy/40 font-sans text-sm">
        Failed to load template: {error}
      </div>
    );
  }

  if (!templateMarkdown) {
    return (
      <div className="text-center py-12 text-navy/40 font-sans text-sm">
        Loading template...
      </div>
    );
  }

  return (
    <div id="doc-preview-document" className="max-w-[700px] mx-auto">
      <CoverPageSection fields={fields} />

      {Object.keys(fields).length > 0 && (
        <div className="my-10 border-t-2 border-navy/10" />
      )}

      <div className="mt-4 mb-2 text-center">
        <p className="text-[11px] font-sans text-navy/40">
          Standard Terms
        </p>
      </div>

      {renderedTemplate}

      <p className="text-[10px] font-sans text-navy/35 mt-6">
        Common Paper Standard Terms · free to use under CC BY 4.0.
      </p>
    </div>
  );
}
