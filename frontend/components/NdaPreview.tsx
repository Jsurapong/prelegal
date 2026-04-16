import {
  NdaFormData,
  formatDate,
  mndaTermText,
  confidentialityTermText,
} from "@/lib/nda-types";

interface Props {
  data: NdaFormData;
}

// ─── Cover field ─────────────────────────────────────────────────────────────

function CoverField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6">
      <div className="sm:w-48 flex-shrink-0 mb-1 sm:mb-0 pt-0.5">
        <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-navy/50">
          {label}
        </p>
        {hint && (
          <p className="text-[10px] font-sans text-navy/35 italic leading-tight mt-0.5">
            {hint}
          </p>
        )}
      </div>
      <div className="flex-1 text-sm font-serif text-navy leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// ─── Signature table ──────────────────────────────────────────────────────────

function SigTable({ data }: { data: NdaFormData }) {
  const rows: { label: string; v1: React.ReactNode; v2: React.ReactNode }[] = [
    { label: "Company",        v1: data.party1.company,      v2: data.party2.company },
    { label: "Print Name",     v1: data.party1.printName,    v2: data.party2.printName },
    { label: "Title",          v1: data.party1.title,        v2: data.party2.title },
    {
      label: "Signature",
      v1: <span className="text-navy/20 italic text-xs">— to be signed —</span>,
      v2: <span className="text-navy/20 italic text-xs">— to be signed —</span>,
    },
    { label: "Notice Address", v1: data.party1.noticeAddress, v2: data.party2.noticeAddress },
    {
      label: "Date",
      v1: formatDate(data.party1.date),
      v2: formatDate(data.party2.date),
    },
  ];

  return (
    <table className="w-full border-collapse text-xs font-sans mt-4">
      <thead>
        <tr>
          <th className="border border-navy/20 px-3 py-2 text-left bg-navy/3 text-[10px] font-bold uppercase tracking-wide text-navy/50 w-32"
              style={{ backgroundColor: "rgba(21,39,74,0.03)" }}>
            &nbsp;
          </th>
          <th className="border border-navy/20 px-3 py-2 text-center bg-navy/3 text-[10px] font-bold uppercase tracking-wide text-navy/70"
              style={{ backgroundColor: "rgba(21,39,74,0.03)" }}>
            Party 1
          </th>
          <th className="border border-navy/20 px-3 py-2 text-center bg-navy/3 text-[10px] font-bold uppercase tracking-wide text-navy/70"
              style={{ backgroundColor: "rgba(21,39,74,0.03)" }}>
            Party 2
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="border border-navy/20 px-3 py-2.5 font-semibold text-navy/60 bg-navy/2 whitespace-nowrap"
                style={{ backgroundColor: "rgba(21,39,74,0.02)" }}>
              {row.label}
            </td>
            <td className="border border-navy/20 px-3 py-2.5 text-center text-navy min-h-[36px]">
              {row.v1 || <span className="text-navy/20">—</span>}
            </td>
            <td className="border border-navy/20 px-3 py-2.5 text-center text-navy min-h-[36px]">
              {row.v2 || <span className="text-navy/20">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 mb-5">
      <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-navy/40 mb-1">
        {children}
      </p>
      <div className="h-px bg-gradient-to-r from-navy/30 via-brass/30 to-transparent" />
    </div>
  );
}

// ─── Clause paragraph ─────────────────────────────────────────────────────────

function Clause({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-serif text-navy/85 leading-[1.75] mb-4 text-justify">
      <span className="font-bold">{number}. {title}. </span>
      {children}
    </p>
  );
}

// ─── Inline field highlight ───────────────────────────────────────────────────

function F({ children }: { children: React.ReactNode }) {
  return <em className="not-italic font-medium text-navy">{children}</em>;
}

// ─── Main document ────────────────────────────────────────────────────────────

export default function NdaPreview({ data }: Props) {
  return (
    <div id="nda-document" className="max-w-[700px] mx-auto">
      {/* Document title */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-normal tracking-tight">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="text-[11px] font-sans text-navy/40 mt-2">
          Common Paper MNDA Standard Terms v1.0 ·{" "}
          <span className="underline decoration-dotted">
            commonpaper.com/standards/mutual-nda/1.0
          </span>
        </p>
        <div className="mt-4 section-rule w-32 mx-auto" />
      </div>

      {/* Instructions note */}
      <p className="text-[12px] font-sans text-navy/55 leading-relaxed italic mb-6 px-1">
        This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover
        Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0. Any modifications
        of the Standard Terms should be made on the Cover Page, which will control over
        conflicts with the Standard Terms.
      </p>

      <SectionHeading>Cover Page</SectionHeading>

      <div className="space-y-4">
        <CoverField label="Purpose" hint="How Confidential Information may be used">
          {data.purpose}
        </CoverField>

        <CoverField label="Effective Date">
          {formatDate(data.effectiveDate)}
        </CoverField>

        <CoverField label="MNDA Term" hint="The length of this MNDA">
          {mndaTermText(data)}
        </CoverField>

        <CoverField label="Term of Confidentiality" hint="How long CI is protected">
          {confidentialityTermText(data)}
        </CoverField>

        <CoverField label="Governing Law &amp; Jurisdiction">
          <span>
            <strong>Governing Law:</strong>{" "}
            {data.governingLaw || <em className="text-navy/40">not specified</em>}
          </span>
          <br />
          <span>
            <strong>Jurisdiction:</strong>{" "}
            {data.jurisdiction || <em className="text-navy/40">not specified</em>}
          </span>
        </CoverField>

        {data.modifications && (
          <CoverField label="MNDA Modifications">
            {data.modifications}
          </CoverField>
        )}
      </div>

      {/* Signature block */}
      <p className="text-[12px] font-serif text-navy/70 italic mt-8 mb-1">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the
        Effective Date.
      </p>
      <SigTable data={data} />

      <p className="text-[10px] font-sans text-navy/35 mt-4 mb-2">
        Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
      </p>

      {/* Divider */}
      <div className="my-10 border-t-2 border-navy/10" />

      <SectionHeading>Standard Terms</SectionHeading>

      <Clause number={1} title="Introduction">
        This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the
        Cover Page (defined below)) (&ldquo;<strong>MNDA</strong>&rdquo;) allows each party
        (&ldquo;<strong>Disclosing Party</strong>&rdquo;) to disclose or make available
        information in connection with the <F>{data.purpose}</F> which (1) the Disclosing Party
        identifies to the receiving party (&ldquo;<strong>Receiving Party</strong>&rdquo;) as
        &ldquo;confidential&rdquo;, &ldquo;proprietary&rdquo;, or the like or (2) should be
        reasonably understood as confidential or proprietary due to its nature and the
        circumstances of its disclosure (&ldquo;<strong>Confidential Information</strong>
        &rdquo;). Each party&rsquo;s Confidential Information also includes the existence and
        status of the parties&rsquo; discussions and information on the Cover Page. Confidential
        Information includes technical or business information, product designs or roadmaps,
        requirements, pricing, security and compliance documentation, technology, inventions and
        know-how. To use this MNDA, the parties must complete and sign a cover page
        incorporating these Standard Terms (&ldquo;<strong>Cover Page</strong>&rdquo;). Each
        party is identified on the Cover Page and capitalized terms have the meanings given
        herein or on the Cover Page.
      </Clause>

      <Clause number={2} title="Use and Protection of Confidential Information">
        The Receiving Party shall: (a) use Confidential Information solely for the{" "}
        <F>{data.purpose}</F>; (b) not disclose Confidential Information to third parties
        without the Disclosing Party&rsquo;s prior written approval, except that the Receiving
        Party may disclose Confidential Information to its employees, agents, advisors,
        contractors and other representatives having a reasonable need to know for the{" "}
        <F>{data.purpose}</F>, provided these representatives are bound by confidentiality
        obligations no less protective of the Disclosing Party than the applicable terms in this
        MNDA and the Receiving Party remains responsible for their compliance with this MNDA;
        and (c) protect Confidential Information using at least the same protections the
        Receiving Party uses for its own similar information but no less than a reasonable
        standard of care.
      </Clause>

      <Clause number={3} title="Exceptions">
        The Receiving Party&rsquo;s obligations in this MNDA do not apply to information that
        it can demonstrate: (a) is or becomes publicly available through no fault of the
        Receiving Party; (b) it rightfully knew or possessed prior to receipt from the
        Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from
        a third party without confidentiality restrictions; or (d) it independently developed
        without using or referencing the Confidential Information.
      </Clause>

      <Clause number={4} title="Disclosures Required by Law">
        The Receiving Party may disclose Confidential Information to the extent required by
        law, regulation or regulatory authority, subpoena or court order, provided (to the
        extent legally permitted) it provides the Disclosing Party reasonable advance notice of
        the required disclosure and reasonably cooperates, at the Disclosing Party&rsquo;s
        expense, with the Disclosing Party&rsquo;s efforts to obtain confidential treatment for
        the Confidential Information.
      </Clause>

      <Clause number={5} title="Term and Termination">
        This MNDA commences on the <F>{formatDate(data.effectiveDate)}</F> and expires at the
        end of the <F>{mndaTermText(data)}</F> Either party may terminate this MNDA for any or
        no reason upon written notice to the other party. The Receiving Party&rsquo;s
        obligations relating to Confidential Information will survive for the{" "}
        <F>{confidentialityTermText(data)}</F>, despite any expiration or termination of this
        MNDA.
      </Clause>

      <Clause number={6} title="Return or Destruction of Confidential Information">
        Upon expiration or termination of this MNDA or upon the Disclosing Party&rsquo;s
        earlier request, the Receiving Party will: (a) cease using Confidential Information;
        (b) promptly after the Disclosing Party&rsquo;s written request, destroy all
        Confidential Information in the Receiving Party&rsquo;s possession or control or
        return it to the Disclosing Party; and (c) if requested by the Disclosing Party,
        confirm its compliance with these obligations in writing. As an exception to subsection
        (b), the Receiving Party may retain Confidential Information in accordance with its
        standard backup or record retention policies or as required by law, but the terms of
        this MNDA will continue to apply to the retained Confidential Information.
      </Clause>

      <Clause number={7} title="Proprietary Rights">
        The Disclosing Party retains all of its intellectual property and other rights in its
        Confidential Information and its disclosure to the Receiving Party grants no license
        under such rights.
      </Clause>

      <Clause number={8} title="Disclaimer">
        ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS IS&rdquo;, WITH ALL FAULTS, AND
        WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND
        FITNESS FOR A PARTICULAR PURPOSE.
      </Clause>

      <Clause number={9} title="Governing Law and Jurisdiction">
        This MNDA and all matters relating hereto are governed by, and construed in accordance
        with, the laws of the State of <F>{data.governingLaw || "_______________"}</F>, without
        regard to the conflict of laws provisions of such{" "}
        <F>{data.governingLaw || "_______________"}</F>. Any legal suit, action, or proceeding
        relating to this MNDA must be instituted in the federal or state courts located in{" "}
        <F>{data.jurisdiction || "_______________"}</F>. Each party irrevocably submits to the
        exclusive jurisdiction of such <F>{data.jurisdiction || "_______________"}</F> in any
        such suit, action, or proceeding.
      </Clause>

      <Clause number={10} title="Equitable Relief">
        A breach of this MNDA may cause irreparable harm for which monetary damages are an
        insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to
        seek appropriate equitable relief, including an injunction, in addition to its other
        remedies.
      </Clause>

      <Clause number={11} title="General">
        Neither party has an obligation under this MNDA to disclose Confidential Information to
        the other or proceed with any proposed transaction. Neither party may assign this MNDA
        without the prior written consent of the other party, except that either party may
        assign this MNDA in connection with a merger, reorganization, acquisition or other
        transfer of all or substantially all its assets or voting securities. Any assignment in
        violation of this Section is null and void. This MNDA will bind and inure to the
        benefit of each party&rsquo;s permitted successors and assigns. Waivers must be signed
        by the waiving party&rsquo;s authorized representative and cannot be implied from
        conduct. If any provision of this MNDA is held unenforceable, it will be limited to
        the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA
        (including the Cover Page) constitutes the entire agreement of the parties with respect
        to its subject matter, and supersedes all prior and contemporaneous understandings,
        agreements, representations, and warranties, whether written or oral, regarding such
        subject matter. This MNDA may only be amended, modified, waived, or supplemented by an
        agreement in writing signed by both parties. Notices, requests and approvals under this
        MNDA must be sent in writing to the email or postal addresses on the Cover Page and are
        deemed delivered on receipt. This MNDA may be executed in counterparts, including
        electronic copies, each of which is deemed an original and which together form the same
        agreement.
      </Clause>

      <p className="text-[10px] font-sans text-navy/35 mt-6">
        Common Paper Mutual Non-Disclosure Agreement{" "}
        <span className="underline decoration-dotted">Version 1.0</span> · free to use under
        CC BY 4.0.
      </p>
    </div>
  );
}
