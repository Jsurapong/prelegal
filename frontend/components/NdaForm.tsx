"use client";

import { useState } from "react";
import { createDefaultFormData, NdaFormData, PartyInfo } from "@/lib/nda-types";

interface Props {
  onSubmit: (data: NdaFormData) => void;
}

// ─── Primitives ─────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  hint,
  required,
  children,
}: {
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-sans font-semibold tracking-wide text-navy uppercase cursor-pointer"
      >
        {children}
        {required && <span className="text-brass ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <span className="block text-xs font-sans text-navy/45 mt-0.5">{hint}</span>
      )}
    </div>
  );
}

const inputCls =
  "w-full border border-navy/20 rounded bg-white px-3.5 py-2.5 text-sm font-sans text-navy placeholder:text-navy/30 transition-all field-input focus:border-navy";

function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint} required={required}>{label}</FieldLabel>
      <input
        id={id}
        type="text"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function DateInput({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <input
        id={id}
        type="date"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function TextareaInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint} required={required}>{label}</FieldLabel>
      <textarea
        id={id}
        className={`${inputCls} resize-y`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-navy/10 rounded-sm shadow-[0_1px_8px_rgba(21,39,74,0.05)]">
      <div
        className="px-7 pt-6 pb-3 border-b"
        style={{ borderColor: "rgba(21,39,74,0.08)" }}
      >
        <h2 className="font-serif text-lg text-navy">{title}</h2>
        {subtitle && (
          <p className="text-xs font-sans text-navy/45 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-7 py-6 space-y-5">{children}</div>
    </div>
  );
}

// ─── Radio option (no interactive children) ───────────────────────────────────

function RadioOption({
  id,
  name,
  value,
  checked,
  onChange,
  children,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 cursor-pointer p-3.5 rounded border transition-all ${
        checked ? "border-navy/40" : "border-navy/10 hover:border-navy/20"
      }`}
      style={{ backgroundColor: checked ? "rgba(21,39,74,0.03)" : undefined }}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            checked ? "border-navy" : "border-navy/30"
          }`}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-navy" />}
        </div>
      </div>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="text-sm font-sans text-navy leading-snug">{children}</div>
    </label>
  );
}

// ─── Year radio row (radio + inline number input, number is outside the label) ─

function YearRadioRow({
  radioId,
  name,
  checked,
  onSelect,
  yearValue,
  onYearChange,
  prefixText,
  suffixText,
}: {
  radioId: string;
  name: string;
  checked: boolean;
  onSelect: () => void;
  yearValue: string;
  onYearChange: (v: string) => void;
  prefixText?: string;
  suffixText?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded border transition-all ${
        checked ? "border-navy/40" : "border-navy/10 hover:border-navy/20"
      }`}
      style={{ backgroundColor: checked ? "rgba(21,39,74,0.03)" : undefined }}
    >
      {/* Visual indicator + hidden accessible radio */}
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={onSelect}
        className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-full"
        aria-label={`${prefixText || ""} ${yearValue} year(s) ${suffixText || ""}`}
      >
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            checked ? "border-navy" : "border-navy/30"
          }`}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-navy" />}
        </div>
      </button>
      <input type="radio" id={radioId} name={name} checked={checked} onChange={onSelect} className="sr-only" />

      {prefixText && (
        <span className="text-sm font-sans text-navy">{prefixText}</span>
      )}

      {/* Year input — intentionally NOT nested in a label to avoid double-activation */}
      <input
        type="number"
        min={1}
        max={10}
        value={yearValue}
        aria-label="Number of years"
        onChange={(e) => {
          onSelect();
          onYearChange(e.target.value);
        }}
        className="w-12 border-b border-navy/40 bg-transparent text-center text-sm font-semibold focus:outline-none focus:border-navy"
      />

      {suffixText && (
        <span className="text-sm font-sans text-navy">{suffixText}</span>
      )}
    </div>
  );
}

// ─── Party section ────────────────────────────────────────────────────────────

function PartyFields({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
}) {
  function set(field: keyof PartyInfo, val: string) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TextInput
        id={`${idPrefix}-company`}
        label="Company"
        required
        value={value.company}
        onChange={(v) => set("company", v)}
        placeholder="Acme Corp."
      />
      <TextInput
        id={`${idPrefix}-name`}
        label="Signatory Name"
        required
        value={value.printName}
        onChange={(v) => set("printName", v)}
        placeholder="Jane Smith"
      />
      <TextInput
        id={`${idPrefix}-title`}
        label="Title"
        required
        value={value.title}
        onChange={(v) => set("title", v)}
        placeholder="Chief Executive Officer"
      />
      <TextInput
        id={`${idPrefix}-address`}
        label="Notice Address"
        required
        value={value.noticeAddress}
        onChange={(v) => set("noticeAddress", v)}
        placeholder="jane@acme.com"
        hint="Email or postal address"
      />
      <DateInput
        id={`${idPrefix}-date`}
        label="Signature Date"
        required
        value={value.date}
        onChange={(v) => set("date", v)}
      />
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function NdaForm({ onSubmit }: Props) {
  // Lazy initializer ensures date reflects the current day at mount time
  const [form, setForm] = useState<NdaFormData>(createDefaultFormData);

  function set<K extends keyof NdaFormData>(key: K, val: NdaFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      {/* Agreement Terms */}
      <Section
        title="Agreement Terms"
        subtitle="Define the scope and duration of this confidentiality arrangement"
      >
        <TextareaInput
          id="purpose"
          label="Purpose"
          hint="How Confidential Information may be used"
          required
          value={form.purpose}
          onChange={(v) => set("purpose", v)}
          rows={2}
        />

        <DateInput
          id="effective-date"
          label="Effective Date"
          required
          value={form.effectiveDate}
          onChange={(v) => set("effectiveDate", v)}
        />

        {/* MNDA Term */}
        <div>
          <div className="mb-1.5">
            <span className="block text-xs font-sans font-semibold tracking-wide text-navy uppercase">
              MNDA Term
            </span>
            <span className="block text-xs font-sans text-navy/45 mt-0.5">
              The length of this MNDA
            </span>
          </div>
          <div className="space-y-2">
            <YearRadioRow
              radioId="mnda-term-expires"
              name="mndaTermType"
              checked={form.mndaTermType === "expires"}
              onSelect={() => set("mndaTermType", "expires")}
              yearValue={form.mndaTermYears}
              onYearChange={(v) => set("mndaTermYears", v)}
              prefixText="Expires after"
              suffixText="year(s) from Effective Date"
            />
            <RadioOption
              id="mnda-term-until-terminated"
              name="mndaTermType"
              value="until_terminated"
              checked={form.mndaTermType === "until_terminated"}
              onChange={() => set("mndaTermType", "until_terminated")}
            >
              Continues until terminated in accordance with the terms of the MNDA
            </RadioOption>
          </div>
        </div>

        {/* Term of Confidentiality */}
        <div>
          <div className="mb-1.5">
            <span className="block text-xs font-sans font-semibold tracking-wide text-navy uppercase">
              Term of Confidentiality
            </span>
            <span className="block text-xs font-sans text-navy/45 mt-0.5">
              How long Confidential Information is protected
            </span>
          </div>
          <div className="space-y-2">
            <YearRadioRow
              radioId="conf-term-expires"
              name="confidentialityTermType"
              checked={form.confidentialityTermType === "expires"}
              onSelect={() => set("confidentialityTermType", "expires")}
              yearValue={form.confidentialityTermYears}
              onYearChange={(v) => set("confidentialityTermYears", v)}
              suffixText="year(s) from Effective Date (trade secrets protected until no longer qualifying under law)"
            />
            <RadioOption
              id="conf-term-perpetuity"
              name="confidentialityTermType"
              value="perpetuity"
              checked={form.confidentialityTermType === "perpetuity"}
              onChange={() => set("confidentialityTermType", "perpetuity")}
            >
              In perpetuity
            </RadioOption>
          </div>
        </div>

        {/* Governing Law & Jurisdiction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            id="governing-law"
            label="Governing Law"
            required
            value={form.governingLaw}
            onChange={(v) => set("governingLaw", v)}
            placeholder="Delaware"
            hint="State name"
          />
          <TextInput
            id="jurisdiction"
            label="Jurisdiction"
            required
            value={form.jurisdiction}
            onChange={(v) => set("jurisdiction", v)}
            placeholder="New Castle, Delaware"
            hint="City/county and state"
          />
        </div>

        {/* Modifications */}
        <TextareaInput
          id="modifications"
          label="MNDA Modifications"
          hint="Any modifications to the standard terms (optional)"
          value={form.modifications}
          onChange={(v) => set("modifications", v)}
          placeholder="None"
          rows={2}
        />
      </Section>

      {/* Party 1 */}
      <Section title="Party 1" subtitle="First party to the agreement">
        <PartyFields
          idPrefix="party1"
          value={form.party1}
          onChange={(v) => set("party1", v)}
        />
      </Section>

      {/* Party 2 */}
      <Section title="Party 2" subtitle="Second party to the agreement">
        <PartyFields
          idPrefix="party2"
          value={form.party2}
          onChange={(v) => set("party2", v)}
        />
      </Section>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="group flex items-center gap-2 px-8 py-3.5 bg-navy text-white font-sans font-medium text-sm rounded shadow-[0_2px_12px_rgba(21,39,74,0.25)] hover:bg-navy-light transition-all hover:shadow-[0_4px_20px_rgba(21,39,74,0.35)] active:scale-[0.98]"
        >
          Preview Agreement
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
