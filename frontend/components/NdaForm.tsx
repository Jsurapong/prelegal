"use client";

import { useState } from "react";
import { DEFAULT_FORM_DATA, NdaFormData, PartyInfo } from "@/lib/nda-types";

interface Props {
  onSubmit: (data: NdaFormData) => void;
}

// ─── Primitives ─────────────────────────────────────────────────────────────

function Label({
  children,
  hint,
  required,
}: {
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <span className="block text-xs font-sans font-semibold tracking-wide text-navy uppercase">
        {children}
        {required && <span className="text-brass ml-1">*</span>}
      </span>
      {hint && <span className="block text-xs font-sans text-navy/45 mt-0.5">{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full border border-navy/20 rounded bg-white px-3.5 py-2.5 text-sm font-sans text-navy placeholder:text-navy/30 transition-all field-input focus:border-navy";

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label hint={hint} required={required}>{label}</Label>
      <input
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
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
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
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  rows = 3,
}: {
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
      <Label hint={hint} required={required}>{label}</Label>
      <textarea
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
      <div className="px-7 pt-6 pb-3 border-b border-navy/8" style={{ borderColor: "rgba(21,39,74,0.08)" }}>
        <h2 className="font-serif text-lg text-navy">{title}</h2>
        {subtitle && (
          <p className="text-xs font-sans text-navy/45 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-7 py-6 space-y-5">{children}</div>
    </div>
  );
}

// ─── Radio group ─────────────────────────────────────────────────────────────

function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer p-3.5 rounded border transition-all ${
        checked
          ? "border-navy/40 bg-navy/3"
          : "border-navy/10 bg-transparent hover:border-navy/20"
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

// ─── Party section ────────────────────────────────────────────────────────────

function PartyFields({
  value,
  onChange,
}: {
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
}) {
  function set(field: keyof PartyInfo, val: string) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TextInput
        label="Company"
        required
        value={value.company}
        onChange={(v) => set("company", v)}
        placeholder="Acme Corp."
      />
      <TextInput
        label="Signatory Name"
        required
        value={value.printName}
        onChange={(v) => set("printName", v)}
        placeholder="Jane Smith"
      />
      <TextInput
        label="Title"
        required
        value={value.title}
        onChange={(v) => set("title", v)}
        placeholder="Chief Executive Officer"
      />
      <TextInput
        label="Notice Address"
        required
        value={value.noticeAddress}
        onChange={(v) => set("noticeAddress", v)}
        placeholder="jane@acme.com"
        hint="Email or postal address"
      />
      <DateInput
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
  const [form, setForm] = useState<NdaFormData>(DEFAULT_FORM_DATA);

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
          label="Purpose"
          hint="How Confidential Information may be used"
          required
          value={form.purpose}
          onChange={(v) => set("purpose", v)}
          rows={2}
        />

        <DateInput
          label="Effective Date"
          required
          value={form.effectiveDate}
          onChange={(v) => set("effectiveDate", v)}
        />

        {/* MNDA Term */}
        <div>
          <Label hint="The length of this MNDA">MNDA Term</Label>
          <div className="space-y-2">
            <RadioOption
              name="mndaTermType"
              value="expires"
              checked={form.mndaTermType === "expires"}
              onChange={() => set("mndaTermType", "expires")}
            >
              Expires after{" "}
              <input
                type="number"
                min={1}
                max={10}
                value={form.mndaTermYears}
                onChange={(e) => set("mndaTermYears", e.target.value)}
                onFocus={() => set("mndaTermType", "expires")}
                className="inline-block w-12 mx-1.5 border-b border-navy/40 bg-transparent text-center text-sm font-semibold focus:outline-none focus:border-navy"
              />{" "}
              year(s) from Effective Date
            </RadioOption>
            <RadioOption
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
          <Label hint="How long Confidential Information is protected">
            Term of Confidentiality
          </Label>
          <div className="space-y-2">
            <RadioOption
              name="confidentialityTermType"
              value="expires"
              checked={form.confidentialityTermType === "expires"}
              onChange={() => set("confidentialityTermType", "expires")}
            >
              <input
                type="number"
                min={1}
                max={10}
                value={form.confidentialityTermYears}
                onChange={(e) => set("confidentialityTermYears", e.target.value)}
                onFocus={() => set("confidentialityTermType", "expires")}
                className="inline-block w-12 mr-1.5 border-b border-navy/40 bg-transparent text-center text-sm font-semibold focus:outline-none focus:border-navy"
              />{" "}
              year(s) from Effective Date{" "}
              <span className="text-navy/50">
                (trade secrets protected until no longer qualifying under law)
              </span>
            </RadioOption>
            <RadioOption
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
            label="Governing Law"
            required
            value={form.governingLaw}
            onChange={(v) => set("governingLaw", v)}
            placeholder="Delaware"
            hint="State name"
          />
          <TextInput
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
          label="MNDA Modifications"
          hint="Any modifications to the standard terms (optional)"
          value={form.modifications}
          onChange={(v) => set("modifications", v)}
          placeholder="None"
          rows={2}
        />
      </Section>

      {/* Party 1 */}
      <Section
        title="Party 1"
        subtitle="First party to the agreement"
      >
        <PartyFields value={form.party1} onChange={(v) => set("party1", v)} />
      </Section>

      {/* Party 2 */}
      <Section
        title="Party 2"
        subtitle="Second party to the agreement"
      >
        <PartyFields value={form.party2} onChange={(v) => set("party2", v)} />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
